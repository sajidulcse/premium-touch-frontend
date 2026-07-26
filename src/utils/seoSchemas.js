/**
 * Schema.org JSON-LD Helper Utilities for Google 2026 Rich Results
 */

const SITE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://premiumtouchbd.com';

export const getOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Premium Touch Interior Decor Studio',
  url: SITE_URL,
  logo: `${SITE_URL}/photo/hero/hero1.jpeg`,
  description: 'Premier luxury interior design and architecture studio specializing in residential and commercial spaces.',
  sameAs: [
    'https://www.facebook.com/premiumtouchbd',
    'https://www.instagram.com/premiumtouchbd',
    'https://www.linkedin.com/company/premiumtouchbd'
  ]
});

export const getLocalBusinessSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'InteriorDesignStudio',
  name: 'Premium Touch Interior Decor Studio',
  image: `${SITE_URL}/photo/hero/hero1.jpeg`,
  '@id': `${SITE_URL}/#organization`,
  url: SITE_URL,
  telephone: '+8801700000000',
  priceRange: '$$$',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'House 12, Road 5, Block D',
    addressLocality: 'Dhaka',
    addressRegion: 'Dhaka',
    postalCode: '1212',
    addressCountry: 'BD'
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 23.7937,
    longitude: 90.4066
  },
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Saturday',
      'Sunday'
    ],
    opens: '09:00',
    closes: '19:00'
  }
});

export const getBreadcrumbSchema = (items = []) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url ? (item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`) : undefined
  }))
});

export const getServiceSchema = (service = {}) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: service.title || 'Interior Design & Decor',
  provider: {
    '@type': 'InteriorDesignStudio',
    name: 'Premium Touch Interior Decor Studio',
    url: SITE_URL
  },
  name: service.title || 'Interior Design Service',
  description: service.description || service.short_description || 'Bespoke interior design services by Premium Touch.',
  areaServed: {
    '@type': 'Country',
    name: 'Bangladesh'
  }
});

export const getBlogPostingSchema = (article = {}) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: article.title,
  image: article.featured_image ? [article.featured_image.startsWith('http') ? article.featured_image : `${SITE_URL}${article.featured_image}`] : [`${SITE_URL}/photo/hero/hero1.jpeg`],
  datePublished: article.created_at || new Date().toISOString(),
  dateModified: article.updated_at || article.created_at || new Date().toISOString(),
  author: {
    '@type': 'Organization',
    name: article.author || 'Premium Touch Editorial Team',
    url: SITE_URL
  },
  publisher: {
    '@type': 'Organization',
    name: 'Premium Touch Interior Decor Studio',
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/photo/hero/hero1.jpeg`
    }
  },
  description: article.excerpt || article.summary || article.title
});

export const getCreativeWorkSchema = (item = {}) => ({
  '@context': 'https://schema.org',
  '@type': 'VisualArtwork',
  name: item.title || item.name || 'Interior Design Project',
  description: item.description || 'Custom luxury interior design portfolio project by Premium Touch.',
  creator: {
    '@type': 'Organization',
    name: 'Premium Touch Interior Decor Studio'
  },
  image: item.image ? (item.image.startsWith('http') ? item.image : `${SITE_URL}${item.image}`) : `${SITE_URL}/photo/hero/hero1.jpeg`
});
