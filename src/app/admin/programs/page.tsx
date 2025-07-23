import { headers } from 'next/headers';
import ProgramsAdmin from '@/app/admin/components/ProgramsAdmin';

export default async function EnrollmentsPage() {
  const headersList = await headers();
  const adminEmail = headersList.get('cf-access-authenticated-user-email') || '';

  return <ProgramsAdmin adminEmail={adminEmail} />;
}
