import { headers } from 'next/headers';
import FriendsList from '@/app/admin/components/FriendsList';

export default async function FriendsPage() {
  const headersList = await headers();
  const adminEmail = headersList.get('cf-access-authenticated-user-email') || '';

  return <FriendsList adminEmail={adminEmail} />;
}
