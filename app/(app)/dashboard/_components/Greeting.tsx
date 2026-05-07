// UTC-based — close enough for AEST (UTC+10/+11). Add timezone handling
// once the user model stores a preferred timezone.
function timeOfDay(): string {
  const h = new Date().getUTCHours();
  // AEST = UTC+10, so subtract 14 to bias toward Australian morning hours
  const local = (h + 10) % 24;
  if (local >= 5 && local < 12) return "Good morning";
  if (local >= 12 && local < 18) return "Good afternoon";
  return "Good evening";
}

interface GreetingProps {
  firstName: string;
}

export function Greeting({ firstName }: GreetingProps) {
  return (
    <div className="pt-10 pb-8 md:pt-14 md:pb-10">
      {/* TODO: replace with "Year X · State · Subject 1, Subject 2" once
          year_id and subject selection exist on the user model */}
      <p className="text-sm font-medium text-muted mb-2 tracking-wide">
        All your subjects
      </p>
      <h2 className="text-3xl md:text-4xl font-bold text-fg leading-tight">
        {timeOfDay()}, {firstName}.
      </h2>
    </div>
  );
}
