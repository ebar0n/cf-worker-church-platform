import { headers } from 'next/headers';
import MembersList from '@/app/admin/components/MembersList';

export default async function MembersPage() {
  const headersList = await headers();
  const adminEmail = headersList.get('cf-access-authenticated-user-email') || '';

  return <MembersList adminEmail={adminEmail} />;
}
