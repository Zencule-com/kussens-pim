import type { CollectionConfig } from 'payload'

export const Vormen: CollectionConfig = {
  slug: 'vormen',
  labels: {
    singular: 'Vorm',
    plural: 'Vormen',
  },
  admin: {
    useAsTitle: 'naam',
    defaultColumns: ['key', 'naam', 'category', 'updatedAt'],
    group: 'Producten',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
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
  ],
  timestamps: true,
}
