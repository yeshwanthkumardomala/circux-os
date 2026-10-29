import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return { name: 'Circux OS', short_name: 'Circux', description: 'Project showcase and exhibition control workspace', start_url: '/display', display: 'standalone', background_color: '#091529', theme_color: '#0b1930', orientation: 'any', icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }] };
}
