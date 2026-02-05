import type { CollectionConfig } from 'payload'

export const Merken: CollectionConfig = {
  slug: 'merken',
  labels: {
    singular: 'Merk',
    plural: 'Merken',
  },
  admin: {
    useAsTitle: 'merknaam',
    defaultColumns: ['merknaam', 'prijs', 'toepassing', 'updatedAt'],
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
      name: 'merknaam',
      type: 'text',
      required: true,
      label: 'Merknaam',
      unique: true,
    },
    {
      name: 'prijs',
      type: 'number',
      label: 'Prijs',
      min: 0,
      admin: {
        description: 'Standaard prijs voor dit merk',
      },
    },
    {
      name: 'korting',
      type: 'number',
      label: 'Korting',
      min: 0,
      admin: {
        description: 'Korting in percentage of bedrag',
      },
    },
    {
      name: 'toepassing',
      type: 'select',
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
      name: 'beschrijving',
      type: 'textarea',
      label: 'Beschrijving',
    },
  ],
  timestamps: true,
}
