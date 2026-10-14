import { headers } from 'next/headers';
import HealthSurveysAdmin from '@/app/admin/components/HealthSurveysAdmin';

// Health surveys for a volunteer event. Rendered without AdminLayout on
// purpose: volunteers fill these on shared iPads and should not be offered the
// rest of the admin navigation.
export default async function HealthSurveysPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const headersList = await headers();
  // Same identity the API stores in capturedBy: on a shared iPad the volunteer
  // needs to see which account their records are being attributed to.
  const volunteerEmail = headersList.get('cf-access-authenticated-user-email') || '';

  // The view is paper, the body's own color: a different canvas showed up as a
  // blank strip in the macOS/iOS rubber-band scroll (the installed app's only
  // reload gesture, left alone on purpose).
  return <HealthSurveysAdmin eventId={parseInt(eventId)} volunteerEmail={volunteerEmail} />;
}
