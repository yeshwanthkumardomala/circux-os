'use client';

import { useEffect, useState } from 'react';

export default function Splash() {
  const [visible, setVisible] = useState(true);
  useEffect(() => { const timer = window.setTimeout(() => setVisible(false), 1500); return () => window.clearTimeout(timer); }, []);
  if (!visible) return null;
  return <div className="splash" aria-label="Loading Circux OS"><div className="splash-logo">C</div><div className="splash-name">Circux <small>SHOWCASE OS</small></div></div>;
}
