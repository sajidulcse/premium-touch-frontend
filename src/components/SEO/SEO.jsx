import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { getSiteInfo, BASE_URL } from '../../api/axios';

const DEFAULT_SITE_TITLE = 'Premium Touch Interior Decor Studio';
const DEFAULT_DESCRIPTION = 'Premium Touch is a premier luxury interior design & decor studio. We craft bespoke residential and commercial spaces with exceptional elegance, modern craftsmanship, and tailored luxury.';
const DEFAULT_KEYWORDS = 'interior design studio, luxury interior decor, home renovation, residential interior design, commercial interior decor, architecture and design, Premium Touch';
const DEFAULT_SITE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://premiumtouchbd.com';
const DEFAULT_OG_IMAGE = '/photo/hero/hero1.jpeg';

/**
 * Reusable High-Performance SEO Component
 * Google 2026 SEO Best Practices Compliant
 */
const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonical,
  ogImage,
  ogType = 'website',
  noindex = false,
  jsonLd = null,
}) => {
  const [dynamicOgImage, setDynamicOgImage] = useState(ogImage || DEFAULT_OG_IMAGE);

  useEffect(() => {
    if (!ogImage) {
      getSiteInfo().then(data => {
        if (data?.og_image) {
          const root = BASE_URL.replace('/api', '');
          const url = data.og_image.startsWith('http') 
            ? data.og_image 
            : `${root}/public/uploads/logo/${data.og_image}`;
          setDynamicOgImage(url);
        }
      }).catch(() => {});
    } else {
      setDynamicOgImage(ogImage);
    }
  }, [ogImage]);

  const pageTitle = title 
    ? `${title} | ${DEFAULT_SITE_TITLE}` 
    : `${DEFAULT_SITE_TITLE} | Luxury Interior Design & Architecture Studio`;

  const fullCanonicalUrl = canonical 
    ? (canonical.startsWith('http') ? canonical : `${DEFAULT_SITE_URL}${canonical}`)
    : (typeof window !== 'undefined' ? window.location.href : DEFAULT_SITE_URL);

  const activeOgImage = dynamicOgImage || DEFAULT_OG_IMAGE;
  const fullOgImage = activeOgImage.startsWith('http') 
    ? activeOgImage 
    : `${DEFAULT_SITE_URL}${activeOgImage.startsWith('/') ? '' : '/'}${activeOgImage}`;

  const jsonLdArray = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

  return (
    <Helmet>
      {/* Basic Primary Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'} />

      {/* Canonical URL */}
      <link rel="canonical" href={fullCanonicalUrl} />

      {/* Open Graph / Facebook / WhatsApp */}
      <meta property="og:site_name" content={DEFAULT_SITE_TITLE} />
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={title || DEFAULT_SITE_TITLE} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title || DEFAULT_SITE_TITLE} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />

      {/* Structured JSON-LD Schemas (Google 2026 Rich Results) */}
      {jsonLdArray.map((schema, index) => (
        <script key={`json-ld-${index}`} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default React.memo(SEO);
