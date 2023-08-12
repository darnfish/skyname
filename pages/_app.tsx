import React from 'react'

import Head from 'next/head'
import { Analytics } from '@vercel/analytics/react'

import '../styles/globals.css'

export default function({ Component, pageProps }) {
  return (
    <div className="font-rounded subpixel-antialiased">
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <title>Skyname</title>
        <meta name="title" content="Skyname" />
        <meta name="description" content="Free, unique usernames for Bluesky—register in seconds." />

        {/* OpenGraph / FB */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://skyna.me/" />
        <meta property="og:title" content="Skyname" />
        <meta property="og:description" content="Free, unique usernames for Bluesky—register in seconds." />
        <meta property="og:image" content="https://skyna.me/banner.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://skyna.me/" />
        <meta property="twitter:title" content="Skyname" />
        <meta property="twitter:description" content="Free, unique usernames for Bluesky—register in seconds." />
        <meta property="twitter:image" content="https://skyna.me/banner.png" />
          
        {/* Favicon */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />
      </Head>
      <Component {...pageProps} />
      <Analytics />
    </div>
  )
}
