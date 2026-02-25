import type { CollectionConfig } from 'payload'

const CATEGORY_LABELS: Record<string, string> = {
  zitkussen: 'Zitkussen',
  rugkussen: 'Rugkussen',
  overig: 'Overig',
}

export const Vormen: CollectionConfig = {
  slug: 'vormen',
  labels: {
    singular: 'Vorm',
    plural: 'Vormen',
  },
  admin: {
    useAsTitle: 'displayTitle',
    defaultColumns: ['key', 'naam', 'category', 'updatedAt'],
    group: 'Producten',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (data) {
          const catLabel = CATEGORY_LABELS[data.category] || data.category || ''
          data.displayTitle = catLabel ? `${data.naam} (${catLabel})` : data.naam
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'key',
      type: 'text',
      required: true,
      unique: true,
      label: 'Key (Slug)',
      admin: {
        description: 'Unieke identifier voor de vorm (bijv. "rechthoekig", "rond")',
      },
    },
    {
      name: 'naam',
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
      name: 'category',
      type: 'select',
      label: 'Categorie',
      options: [
        {
          label: 'Zitkussen',
          value: 'zitkussen',
        },
        {
          label: 'Rugkussen',
          value: 'rugkussen',
        },
        {
          label: 'Overig',
          value: 'overig',
        },
      ],
    },
    {
      name: 'modelPath',
      type: 'text',
      label: 'Model Pad',
      admin: {
        description: 'Pad naar het 3D model bestand',
      },
    },
    {
      name: 'displayTitle',
      type: 'text',
      label: 'Weergavetitel',
      admin: {
        hidden: true,
      },
    },
  ],
  timestamps: true,
}
