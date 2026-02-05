import type { CollectionConfig } from 'payload'

export const Vullingen: CollectionConfig = {
  slug: 'vullingen',
  labels: {
    singular: 'Vulling',
    plural: 'Vullingen',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'pricePerUnit', 'updatedAt'],
    group: 'Vullingen',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Titel',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Beschrijving',
    },
    {
      name: 'pricePerUnit',
      type: 'number',
      required: true,
      label: 'Prijs per eenheid',
      min: 0,
    },
    {
      name: 'afbeelding',
      type: 'upload',
      relationTo: 'media',
      label: 'Afbeelding',
    },
  ],
  timestamps: true,
}
