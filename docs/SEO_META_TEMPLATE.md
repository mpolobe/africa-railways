# SEO Meta Tags Template for Africa Railways

Use this template when creating new pages or updating existing ones.

## Full SEO Meta Tag Block

```html
<!-- Primary Meta Tags -->
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>[Page Title] | Africa Railways</title>
<meta name="title" content="[Page Title] | Africa Railways">
<meta name="description" content="[150-160 character description of the page content]">
<meta name="keywords" content="Africa Railways, blockchain, train tickets, SENT token, Africoin, railway, Africa, crypto, DeFi, PinkSale">
<meta name="author" content="Africa Railways">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://africarailways.com/[page-path]">

<!-- Theme & PWA -->
<meta name="theme-color" content="#FFB800">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Africa Railways">
<link rel="manifest" href="/manifest.json">
<link rel="apple-touch-icon" href="/icons/icon-192x192.png">
<link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://africarailways.com/[page-path]">
<meta property="og:title" content="[Page Title] | Africa Railways">
<meta property="og:description" content="[Description for social sharing]">
<meta property="og:image" content="https://africarailways.com/images/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:site_name" content="Africa Railways">
<meta property="og:locale" content="en_US">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:url" content="https://africarailways.com/[page-path]">
<meta name="twitter:title" content="[Page Title] | Africa Railways">
<meta name="twitter:description" content="[Description for Twitter]">
<meta name="twitter:image" content="https://africarailways.com/images/twitter-card.png">
<meta name="twitter:site" content="@AfricaRailways">
<meta name="twitter:creator" content="@AfricaRailways">

<!-- Structured Data - Organization -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Africa Railways",
  "url": "https://africarailways.com",
  "logo": "https://africarailways.com/icons/icon-512x512.png",
  "description": "Building Africa's digital railway infrastructure powered by blockchain technology",
  "sameAs": [
    "https://twitter.com/AfricaRailways",
    "https://t.me/africarailways",
    "https://github.com/mpolobe/africa-railways"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "admin@africarailways.com",
    "contactType": "customer service"
  }
}
</script>
```

## Page-Specific Structured Data

### For Token/Crypto Pages
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "SENT Token",
  "description": "Sentinel Network Token - Governance and utility token for Africa Railways ecosystem",
  "brand": {
    "@type": "Brand",
    "name": "Africa Railways"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://www.pinksale.finance/launchpad/polygon/0xf366e3aaCC54C99E50c90B7C57625776f88D8d08",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  }
}
</script>
```

### For Blog/Article Pages
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "[Article Title]",
  "description": "[Article description]",
  "image": "https://africarailways.com/images/[article-image].png",
  "author": {
    "@type": "Organization",
    "name": "Africa Railways"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Africa Railways",
    "logo": {
      "@type": "ImageObject",
      "url": "https://africarailways.com/icons/icon-512x512.png"
    }
  },
  "datePublished": "[YYYY-MM-DD]",
  "dateModified": "[YYYY-MM-DD]"
}
</script>
```

### For FAQ Pages
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is SENT token?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "SENT is the governance and utility token for the Africa Railways Sentinel Network."
      }
    }
  ]
}
</script>
```

## Social Media Image Specifications

| Platform | Size | Format |
|----------|------|--------|
| Open Graph | 1200x630px | PNG/JPG |
| Twitter Card | 1200x600px | PNG/JPG |
| Favicon | 32x32, 16x16 | PNG |
| Apple Touch | 180x180px | PNG |

## Keywords by Page Type

**Homepage**: Africa Railways, train tickets Africa, blockchain railway, SENT token, Africoin, digital payments Africa

**Tokenomics**: SENT token, Africoin AFC, crypto tokenomics, DeFi Africa, PinkSale IDO, polygon token

**Sentinel**: railway safety, worker safety Africa, sentinel network, blockchain verification

**Blog/Reviews**: crypto reviews, token analysis, DeFi projects, Africa blockchain, railway news
