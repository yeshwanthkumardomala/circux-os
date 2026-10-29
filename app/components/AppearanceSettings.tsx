'use client';

import { Moon, Sun } from 'lucide-react';

export default function AppearanceSettings({ dark, setDark }: { dark: boolean; setDark: (dark: boolean) => void }) {
  return <section className="card appearance-settings"><div><div className="eyebrow">Appearance</div><h2>Workspace theme</h2><p className="muted">Choose the light or dark admin workspace theme.</p></div><div className="actions"><button className={`btn${!dark ? ' primary' : ''}`} aria-pressed={!dark} onClick={() => setDark(false)}><Sun size={15} /> Light</button><button className={`btn${dark ? ' primary' : ''}`} aria-pressed={dark} onClick={() => setDark(true)}><Moon size={15} /> Dark</button></div></section>;
}
