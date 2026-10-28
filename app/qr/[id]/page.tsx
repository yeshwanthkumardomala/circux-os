import { redirect } from 'next/navigation';

export default function LegacyQrPage({ params }: { params: { id: string } }) {
  redirect(`/project/${encodeURIComponent(params.id)}`);
}
