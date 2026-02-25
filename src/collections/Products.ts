import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  labels: {
    singular: 'Product',
    plural: 'Producten',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['uid', 'name', 'category', 'updatedAt'],
    group: 'Producten',
  },
  access: {
    read: () => true, // Iedereen kan lezen
    create: () => true, // Iedereen kan aanmaken (pas aan naar access control)
    update: () => true, // Iedereen kan updaten (pas aan naar access control)
    delete: () => true, // Iedereen kan verwijderen (pas aan naar access control)
  },
  fields: [
    {
      name: 'uid',
      type: 'text',
      required: true,
      label: 'UID (Slug)',
      unique: true,
      admin: {
        description: 'Unieke identifier voor calculatie',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Product naam',
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
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Afbeelding',
    },
    {
      name: 'active',
      type: 'checkbox',
      label: 'Actief',
      defaultValue: true,
    },
    {
      name: 'vormen',
      type: 'relationship',
      relationTo: 'vormen',
      hasMany: true,
      label: 'Vormen',
      admin: {
        description: 'Vormen die dit product ondersteunt',
      },
      // Skip client-side validation — it incorrectly rejects integer IDs
      // because the db adapter's defaultIDType isn't available in the browser
      validate: () => true,
    },
  ],
  timestamps: true,
}
