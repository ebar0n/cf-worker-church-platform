import { headers } from 'next/headers';
import VolunteerEventsAdmin from './VolunteerEventsAdmin';

export default async function VolunteerEventsPage() {
  const headersList = await headers();
  const adminEmail = headersList.get('cf-access-authenticated-user-email') || '';

  return <VolunteerEventsAdmin adminEmail={adminEmail} />;
}
