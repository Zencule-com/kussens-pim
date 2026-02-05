import type { CollectionConfig } from 'payload'

export const Finishes: CollectionConfig = {
  slug: 'finishes',
  labels: {
    singular: 'Afwerking',
    plural: 'Afwerkingen',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'description', 'updatedAt'],
    group: 'Afwerkingen',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Naam',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Beschrijving',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Afbeelding',
    },
    {
      name: 'imageAlternative',
      type: 'upload',
      relationTo: 'media',
      label: 'Alternatieve afbeelding',
    },
    {
      name: 'products',
      type: 'select',
      hasMany: true,
      label: 'Producten',
      options: [
        { label: 'Zitstrak', value: 'zitstrak' },
        { label: 'Rugstrak', value: 'rugstrak' },
        { label: 'Rugplof', value: 'rugplof' },
        { label: 'Zitplof', value: 'zitplof' },
        { label: 'Rugschuinstrak', value: 'rugschuinstrak' },
        { label: 'Sierrecht', value: 'sierrecht' },
        { label: 'Sier', value: 'sier' },
        { label: 'Plank', value: 'plank' },
      ],
    },
  ],
  timestamps: true,
}
