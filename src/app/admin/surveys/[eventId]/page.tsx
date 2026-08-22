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

  return <HealthSurveysAdmin eventId={parseInt(eventId)} />;
}
