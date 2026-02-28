import type { CollectionConfig } from 'payload'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  labels: {
    singular: 'Review',
    plural: 'Reviews',
  },
  admin: {
    useAsTitle: 'reviewerName',
    defaultColumns: ['reviewerName', 'source', 'rating', 'date'],
    group: 'Reviews',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'source',
      type: 'select',
      required: true,
      options: [
        { label: 'Kiyoh', value: 'kiyoh' },
        { label: 'Google', value: 'google' },
      ],
    },
    {
      name: 'externalId',
      type: 'text',
      required: true,
      unique: true,
      label: 'External ID',
      admin: {
        description: 'Dedup key: kiyoh:{id} or google:{author}:{timestamp}',
      },
    },
    {
      name: 'rating',
      type: 'number',
      required: true,
      min: 1,
      max: 10,
      label: 'Beoordeling (1-10)',
    },
    {
      name: 'reviewerName',
      type: 'text',
      required: true,
      label: 'Naam reviewer',
    },
    {
      name: 'title',
      type: 'text',
      label: 'Titel',
    },
    {
      name: 'content',
      type: 'textarea',
      label: 'Inhoud',
    },
    {
      name: 'city',
      type: 'text',
      label: 'Plaats',
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      label: 'Datum',
    },
    {
      name: 'ownerResponse',
      type: 'textarea',
      label: 'Reactie eigenaar',
    },
  ],
  timestamps: true,
}
