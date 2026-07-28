import Script from 'next/script'

// Measurement ID. Set per-environment via NEXT_PUBLIC_GA_ID.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID

/**
 * Google Analytics 4 (gtag.js).
 * Only loads in production so local development doesn't pollute reporting.
 * Renders nothing when NEXT_PUBLIC_GA_ID is not set.
 * GA4 enhanced measurement tracks App Router client-side navigations via
 * browser history events, so no manual pageview calls are needed.
 */
export function GoogleAnalytics() {
  if (process.env.NODE_ENV !== 'production') return null
  if (!GA_ID) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  )
}
