import { CalendarDays, Clock } from 'lucide-react';
import { formatEventDate, formatEventTime } from '@/lib/utils';

interface Props {
  title: string;
  imageUrl?: string | null;
  eventDate?: string | null;
  eventTime?: string | null;
}

// Cover image and date/time of a program, shown in every enrollment flow's hero
export default function ProgramEventInfo({ title, imageUrl, eventDate, eventTime }: Props) {
  return (
    <>
      {(eventDate || eventTime) && (
        <div className="text-ink flex flex-wrap gap-x-6 gap-y-2 text-base font-medium">
          {eventDate && (
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="text-ink-soft h-5 w-5" strokeWidth={1.5} />
              {formatEventDate(eventDate)}
            </span>
          )}
          {eventTime && (
            <span className="inline-flex items-center gap-2">
              <Clock className="text-ink-soft h-5 w-5" strokeWidth={1.5} />
              {formatEventTime(eventTime)}
            </span>
          )}
        </div>
      )}
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={title}
          className="border-line w-full rounded-2xl border object-cover"
        />
      )}
    </>
  );
}
