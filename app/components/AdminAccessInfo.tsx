import { KeyRound, ShieldCheck } from 'lucide-react';

export default function AdminAccessInfo() {
  return <section className="card admin-access"><div className="card-head"><h2><ShieldCheck size={17} /> Local backend access</h2><KeyRound size={16} /></div><p>The shared admin token is stored in the ignored local <code>.env</code> file as <code>CIRCUX_ADMIN_TOKEN</code>. On Windows, <code>RUN-CIRCUX.bat</code> creates and saves one if needed, then prints it in that terminal for the browser prompt and Board Health page.</p><p className="muted">This admin token is different from a board/device token. Keep it private; do not paste it into a QR code or a public page.</p><a className="text-button" href="http://localhost:8000/docs" target="_blank" rel="noreferrer">Open local FastAPI documentation ↗</a></section>;
}
