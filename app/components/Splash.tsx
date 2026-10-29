'use client';

import { useEffect, useState } from 'react';

export default function Splash() {
  const [visible, setVisible] = useState(true);
  useEffect(() => { const timer = window.setTimeout(() => setVisible(false), 1500); return () => window.clearTimeout(timer); }, []);
  if (!visible) return null;
  return <div className="splash" role="status" aria-label="Loading Circux OS"><div className="splash-brands"><div className="splash-logo" aria-label="Circux">C</div><span className="splash-divider" aria-hidden="true">×</span><img className="splash-partner-logo" src="/sidya-logo.jpeg" alt="Sidya v05 logo" /></div><div className="splash-name">Circux <small>SHOWCASE OS</small></div><div className="splash-credit"><strong>sidya.v05</strong> <span>·</span> Developed by Yeshwanthkumardomala</div></div>;
}
