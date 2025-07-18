import { headers } from 'next/headers';
import AnnouncementsAdmin from './AnnouncementsAdmin';

export default async function AdminAnnouncementsPage() {
  const headersList = await headers();
  const adminEmail = headersList.get('cf-access-authenticated-user-email') || '';

  return <AnnouncementsAdmin adminEmail={adminEmail} />;
}
