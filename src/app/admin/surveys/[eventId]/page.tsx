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

  return (
    <>
      {/* The view paints the viewport #f7f6f3 while the site's body stays white,
          so the rubber-band scroll on macOS/iOS exposed a white strip that read
          as a blank section below the list. Painting the canvas the same color
          closes it, and stopping the vertical bounce also disables pull-to-refresh
          so the iPads cannot drag the page while a volunteer fills the form. */}
      <style>{`body { background: #f7f6f3; overscroll-behavior-y: none; }`}</style>
      <HealthSurveysAdmin eventId={parseInt(eventId)} volunteerEmail={volunteerEmail} />
    </>
  );
}
