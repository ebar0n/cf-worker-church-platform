import { headers } from 'next/headers';
import ProgramRosterAdmin from '@/app/admin/components/ProgramRosterAdmin';

export default async function ProgramRosterAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const headersList = await headers();
  const adminEmail = headersList.get('cf-access-authenticated-user-email') || '';

  return <ProgramRosterAdmin programId={parseInt(id)} adminEmail={adminEmail} />;
}
