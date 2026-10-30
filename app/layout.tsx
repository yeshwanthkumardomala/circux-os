import './globals.css';
import type { Metadata, Viewport } from 'next';
import Splash from './components/Splash';
import ServiceWorker from './components/ServiceWorker';
import BrandCredit from './components/BrandCredit';

export const metadata: Metadata = { title: 'Circux OS', description: 'Connect. Monitor. Create.' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><Splash /><ServiceWorker />{children}<BrandCredit /></body></html>;
}
