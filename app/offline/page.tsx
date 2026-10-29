import Link from 'next/link';
import GlobalProjectSearch from '../components/GlobalProjectSearch';

export default function OfflinePage() {
  return <main className="public-page"><div className="public-search-row"><GlobalProjectSearch /></div><div className="public-card error-card"><div className="eyebrow">Circux OS · offline</div><h1>Connection unavailable</h1><p>Reconnect the phone or display computer to the same Wi‑Fi network, then reload the project page.</p><Link href="/">Try the workspace again</Link></div></main>;
}
