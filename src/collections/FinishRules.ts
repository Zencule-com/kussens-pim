import type { CollectionConfig } from 'payload'

export const FinishRules: CollectionConfig = {
  slug: 'finish-rules',
  labels: {
    singular: 'Afwerking Regel',
    plural: 'Afwerking Regels',
  },
  admin: {
    useAsTitle: 'ruleLabel',
    defaultColumns: ['finish', 'between', 'price', 'updatedAt'],
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
      name: 'finish',
      type: 'relationship',
      relationTo: 'finishes',
      required: true,
      label: 'Afwerking',
    },
    {
      name: 'between',
      type: 'text',
      required: true,
      label: 'Bereik',
      admin: {
        description: 'Bijv. "0-100" of "101-150"',
      },
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      label: 'Prijs',
      min: 0,
    },
    {
      name: 'ruleLabel',
      type: 'text',
      label: 'Label',
      admin: {
        readOnly: true,
        description: 'Automatisch gegenereerd label',
      },
      hooks: {
        beforeChange: [
          ({ data }) => {
            if (data?.between && data?.price !== undefined) {
              return `${data.between}: €${data.price.toFixed(2)}`
            }
            return ''
          },
        ],
      },
    },
  ],
  timestamps: true,
}
