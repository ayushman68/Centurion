import type {MetadataRoute} from 'next';
export default function sitemap():MetadataRoute.Sitemap{return [{url:process.env.BETTER_AUTH_URL||'http://localhost:3000',changeFrequency:'monthly',priority:1}];}
