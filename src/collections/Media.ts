import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload'

// Hook om de prefix automatisch in te stellen op basis van het merk
const setPrefixFromMerk: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  // Als de prefix al is ingesteld (bijv. via import script), gebruik die
  if (data?.prefix) {
    return data
  }

  // Alleen bij create operaties en als er een merk is
  if (operation === 'create' && data?.merk && req?.payload) {
    try {
      // Haal het merk op om de naam te krijgen
      const merkId = typeof data.merk === 'string' ? data.merk : data.merk.id
      
      if (!merkId) {
        return data
      }

      const merk = await req.payload.findByID({
        collection: 'merken',
        id: merkId,
        depth: 0,
      })

      if (merk?.merknaam) {
        // Maak folder naam URL-vriendelijk
        const folderName = merk.merknaam
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')

        // Stel de prefix in
        data.prefix = folderName
      }
    } catch (error: any) {
      // Als het merk niet gevonden kan worden, gebruik de prefix die al is ingesteld
      // of laat het leeg (geen error gooien, gewoon doorgaan)
      if (error?.status !== 404) {
        // Alleen loggen als het geen 404 is (merk niet gevonden)
        console.error('Error setting prefix from merk:', error?.message || error)
      }
    }
  }

  return data
}

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Beheer',
  },
  access: {
    read: () => true,
  },
  hooks: {
    beforeChange: [setPrefixFromMerk],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'merk',
      type: 'relationship',
      relationTo: 'merken',
      label: 'Merk',
      admin: {
        description: 'Het merk waartoe deze afbeelding behoort',
      },
    },
    {
      name: 'prefix',
      type: 'text',
      label: 'Prefix (folder)',
      admin: {
        description: 'De folder naam voor deze afbeelding (wordt automatisch ingesteld op basis van merk)',
        readOnly: true,
        hidden: true, // Verberg in admin, wordt automatisch ingesteld
      },
    },
  ],
  upload: true,
}
