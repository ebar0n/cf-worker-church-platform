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
          as a blank section below the list; painting the canvas the same color is
          what closes it. The bounce itself is left alone on purpose: in the
          installed app it is the only reload gesture there is, and a half-filled
          form now survives a reload as a draft. */}
      <style>{`body { background: #f7f6f3; }`}</style>
      <HealthSurveysAdmin eventId={parseInt(eventId)} volunteerEmail={volunteerEmail} />
    </>
  );
}
