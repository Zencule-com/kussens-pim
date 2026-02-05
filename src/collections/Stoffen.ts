import type { CollectionConfig } from 'payload'

export const Stoffen: CollectionConfig = {
  slug: 'stoffen',
  labels: {
    singular: 'Stof',
    plural: 'Stoffen',
  },
  admin: {
    useAsTitle: 'naam',
    defaultColumns: ['naam', 'merk', 'toepassing', 'prijsPerMeter', 'updatedAt'],
    group: 'Stoffen',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'naam',
      type: 'text',
      required: true,
      label: 'Stof naam',
    },
    {
      name: 'merk',
      type: 'relationship',
      relationTo: 'merken',
      required: true,
      label: 'Merk',
    },
    {
      name: 'toepassing',
      type: 'select',
      required: true,
      label: 'Toepassing',
      options: [
        {
          label: 'Binnen',
          value: 'binnen',
        },
        {
          label: 'Buiten',
          value: 'buiten',
        },
        {
          label: 'Beide',
          value: 'beide',
        },
      ],
    },
    {
      name: 'kuntleder',
      type: 'checkbox',
      label: 'Kuntleder',
      defaultValue: false,
    },
    {
      name: 'prijsPerMeter',
      type: 'number',
      required: true,
      label: 'Prijs per strekkende meter',
      min: 0,
      admin: {
        description: "Prijs in euro's per strekkende meter",
      },
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
