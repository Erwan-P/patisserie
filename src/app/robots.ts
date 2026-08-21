import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/profil/', '/panier/', '/commande/'],
    },
    sitemap: 'https://lamaisonsucree.fr/sitemap.xml',
  };
}
