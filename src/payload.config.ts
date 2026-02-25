import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { nl } from 'payload/i18n/nl'
import { en } from 'payload/i18n/en'
import { s3Storage } from '@payloadcms/storage-s3'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Products } from './collections/Products'
import { Merken } from './collections/Merken'
import { Stoffen } from './collections/Stoffen'
import { Finishes } from './collections/Finishes'
import { FinishRules } from './collections/FinishRules'
import { Vullingen } from './collections/Vullingen'
import { Vormen } from './collections/Vormen'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  i18n: {
    supportedLanguages: { nl, en },
  },
  collections: [Users, Media, Products, Merken, Stoffen, Finishes, FinishRules, Vullingen, Vormen],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [
    s3Storage({
      alwaysInsertFields: true, // Zorgt ervoor dat prefix veld altijd beschikbaar is
      collections: {
        media: {
          prefix: 'prefix', // Gebruik het 'prefix' veld uit de collectie
        },
      },
      bucket: process.env.MINIO_BUCKET || 'media',
      config: {
        credentials: {
          accessKeyId: process.env.MINIO_ACCESS_KEY || '',
          secretAccessKey: process.env.MINIO_SECRET_KEY || '',
        },
        endpoint: process.env.MINIO_PUBLIC_ENDPOINT || process.env.MINIO_ENDPOINT,
        region: 'us-east-1',
        forcePathStyle: true, // Belangrijk voor MinIO!
      },
    }),
  ],
})
