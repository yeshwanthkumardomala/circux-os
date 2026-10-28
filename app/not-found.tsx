import Link from 'next/link';

export default function NotFound() {
  return <main className="public-page"><div className="public-card error-card"><div className="eyebrow">Circux OS</div><h1>That page is unavailable</h1><p>The project link may be incorrect, or the display is not connected to the local network.</p><Link href="/">Return to workspace</Link></div></main>;
}
