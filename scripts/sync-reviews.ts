import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

// --- Kiyoh types (actual API response shape) ---

interface KiyohReviewContentItem {
  questionGroup: string
  questionType: string
  rating: string | number
  order: number
}

interface KiyohRawReview {
  reviewId: string
  reviewAuthor: string
  city: string
  dateSince: string
  updatedSince: string
  reviewComments: string | null
  reviewContent: KiyohReviewContentItem[][]
}

interface KiyohResponse {
  locationId: number
  locationName: string
  averageRating: number
  numberReviews: number
  percentageRecommendation: number
  reviews: KiyohRawReview[]
}

// Parsed review after extracting fields from reviewContent
interface KiyohReview {
  reviewId: string
  reviewAuthor: string
  city: string
  dateSince: string
  rating: number
  headline: string
  text: string
  reviewComment: string | null
}

function parseKiyohReview(raw: KiyohRawReview): KiyohReview {
  let rating = 0
  let headline = ''
  let text = ''

  // reviewContent is an array of arrays — flatten and extract by questionGroup
  const items = raw.reviewContent.flat()
  for (const item of items) {
    switch (item.questionGroup) {
      case 'DEFAULT_OVERALL':
        rating = Number(item.rating) || 0
        break
      case 'DEFAULT_ONELINER':
        headline = String(item.rating || '')
        break
      case 'DEFAULT_OPINION':
        text = String(item.rating || '')
        break
    }
  }

  return {
    reviewId: raw.reviewId,
    reviewAuthor: raw.reviewAuthor,
    city: raw.city,
    dateSince: raw.dateSince,
    rating,
    headline,
    text,
    reviewComment: raw.reviewComments,
  }
}

// --- Google types ---

interface GoogleReview {
  author_name: string
  rating: number
  text: string
  time: number
  relative_time_description: string
}

interface GooglePlacesResponse {
  result: {
    reviews?: GoogleReview[]
    rating?: number
    user_ratings_total?: number
  }
  status: string
}

// --- Fetch functions ---

async function fetchKiyohReviews(): Promise<KiyohReview[]> {
  const hash = process.env.KIYOH_FEED_HASH
  if (!hash) {
    console.log('   KIYOH_FEED_HASH not set, skipping Kiyoh')
    return []
  }

  const url = `https://www.kiyoh.com/v1/review/feed.json?hash=${hash}&limit=10000`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Kiyoh API error: ${response.status} ${response.statusText}`)
  }

  const data: KiyohResponse = await response.json()
  console.log(`   Kiyoh location: ${data.locationName} (avg: ${data.averageRating}, total: ${data.numberReviews})`)
  if ((data.reviews || []).length < data.numberReviews) {
    console.log(`   Warning: API returned ${data.reviews.length} of ${data.numberReviews} reviews`)
  }

  return (data.reviews || []).map(parseKiyohReview)
}

async function fetchGoogleReviews(): Promise<GoogleReview[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  const placeId = process.env.GOOGLE_PLACE_ID
  if (!apiKey || !placeId) {
    console.log('   GOOGLE_PLACES_API_KEY or GOOGLE_PLACE_ID not set, skipping Google')
    return []
  }

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&key=${apiKey}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.status} ${response.statusText}`)
  }

  const data: GooglePlacesResponse = await response.json()
  if (data.status !== 'OK') {
    throw new Error(`Google Places API status: ${data.status}`)
  }

  return data.result.reviews || []
}

// --- Main sync ---

async function syncReviews() {
  console.log('Starting reviews sync...\n')

  let payload
  try {
    console.log('1. Initializing Payload...')
    payload = await getPayload({ config })
    console.log('   Payload initialized successfully\n')
  } catch (error: any) {
    console.error('   Error initializing Payload:', error?.message || error)
    process.exit(1)
  }

  console.log('2. Fetching reviews from APIs...\n')

  const [kiyohReviews, googleReviews] = await Promise.all([
    fetchKiyohReviews().catch((err) => {
      console.error('   Kiyoh fetch error:', err.message)
      return [] as KiyohReview[]
    }),
    fetchGoogleReviews().catch((err) => {
      console.error('   Google fetch error:', err.message)
      return [] as GoogleReview[]
    }),
  ])

  console.log(`   Kiyoh: ${kiyohReviews.length} reviews fetched`)
  console.log(`   Google: ${googleReviews.length} reviews fetched\n`)

  console.log('3. Syncing to PIM...\n')

  let created = 0
  let skipped = 0
  let errors = 0

  // Sync Kiyoh reviews
  for (const review of kiyohReviews) {
    const externalId = `kiyoh:${review.reviewId}`
    try {
      const existing = await payload.find({
        collection: 'reviews',
        where: { externalId: { equals: externalId } },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        skipped++
        continue
      }

      await payload.create({
        collection: 'reviews',
        data: {
          source: 'kiyoh',
          externalId,
          rating: review.rating,
          reviewerName: review.reviewAuthor || 'Anoniem',
          title: review.headline || undefined,
          content: review.text || undefined,
          city: review.city || undefined,
          date: review.dateSince,
          ownerResponse: review.reviewComment || undefined,
        },
      })

      created++
    } catch (error: any) {
      errors++
      console.error(`   Error syncing kiyoh review ${review.reviewId}:`, error?.message || error)
    }
  }

  // Sync Google reviews
  for (const review of googleReviews) {
    const externalId = `google:${review.author_name}:${review.time}`
    try {
      const existing = await payload.find({
        collection: 'reviews',
        where: { externalId: { equals: externalId } },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        skipped++
        continue
      }

      // Normalize Google rating (1-5) to 1-10 scale
      const normalizedRating = Math.min(10, Math.max(1, review.rating * 2))

      await payload.create({
        collection: 'reviews',
        data: {
          source: 'google',
          externalId,
          rating: normalizedRating,
          reviewerName: review.author_name || 'Anoniem',
          content: review.text || undefined,
          date: new Date(review.time * 1000).toISOString(),
        },
      })

      created++
    } catch (error: any) {
      errors++
      console.error(`   Error syncing google review:`, error?.message || error)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('SYNC SUMMARY')
  console.log('='.repeat(60))
  console.log(`Kiyoh reviews fetched: ${kiyohReviews.length}`)
  console.log(`Google reviews fetched: ${googleReviews.length}`)
  console.log(`Created: ${created}`)
  console.log(`Skipped (already exists): ${skipped}`)
  console.log(`Errors: ${errors}`)
  console.log('='.repeat(60))

  process.exit(0)
}

syncReviews().catch((error: any) => {
  console.error('\nFatal error:', error?.message || error)
  if (error?.stack) {
    console.error('\nStack trace:')
    console.error(error.stack.split('\n').slice(0, 10).join('\n'))
  }
  process.exit(1)
})
