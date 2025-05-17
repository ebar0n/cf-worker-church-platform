import { headers } from 'next/headers';
import AdminDashboard from '@/app/admin/components/AdminDashboard';

export default async function AdminPage() {
  const headersList = await headers();
  const adminEmail = headersList.get('cf-access-authenticated-user-email') || '';

  return <AdminDashboard adminEmail={adminEmail} />;
}
