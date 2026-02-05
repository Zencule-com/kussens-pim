import { headers as getHeaders } from 'next/headers.js'
import Image from 'next/image'
import { getPayload } from 'payload'
import React from 'react'
import { fileURLToPath } from 'url'

import config from '@/payload.config'
import './styles.css'

export default async function HomePage() {
  let user = null
  let payloadConfig
  
  try {
    const headers = await getHeaders()
    payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })
    
    try {
      const authResult = await payload.auth({ headers })
      user = authResult?.user || null
    } catch (authError) {
      // Auth errors are expected for unauthenticated users, so we ignore them
      console.log('Auth check:', authError instanceof Error ? authError.message : 'No user')
    }
  } catch (error) {
    console.error('Error initializing Payload:', error)
    // Continue with default values
  }

  const fileURL = `vscode://file/${fileURLToPath(import.meta.url)}`
  const adminRoute = payloadConfig?.routes?.admin || '/admin'

  return (
    <div className="home">
      <div className="content">
        <picture>
          <source srcSet="https://raw.githubusercontent.com/payloadcms/payload/main/packages/ui/src/assets/payload-favicon.svg" />
          <Image
            alt="Payload Logo"
            height={65}
            src="https://raw.githubusercontent.com/payloadcms/payload/main/packages/ui/src/assets/payload-favicon.svg"
            width={65}
          />
        </picture>
        {!user && <h1>Welcome to your new project.</h1>}
        {user && <h1>Welcome back, {user.email}</h1>}
        <div className="links">
          <a
            className="admin"
            href={adminRoute}
            rel="noopener noreferrer"
            target="_blank"
          >
            Go to admin panel
          </a>
          <a
            className="docs"
            href="https://payloadcms.com/docs"
            rel="noopener noreferrer"
            target="_blank"
          >
            Documentation
          </a>
        </div>
      </div>
      <div className="footer">
        <p>Update this page by editing</p>
        <a className="codeLink" href={fileURL}>
          <code>app/(frontend)/page.tsx</code>
        </a>
      </div>
    </div>
  )
}
