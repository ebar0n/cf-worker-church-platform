import { headers } from 'next/headers';
import CoursesAdmin from '@/app/admin/components/CoursesAdmin';

export default async function CoursesPage() {
  const headersList = await headers();
  const adminEmail = headersList.get('cf-access-authenticated-user-email') || '';

  return <CoursesAdmin adminEmail={adminEmail} />;
}
