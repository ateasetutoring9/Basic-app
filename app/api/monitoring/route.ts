export const runtime = "edge";

const SENTRY_HOST = "o4511353108234240.ingest.de.sentry.io";
const SENTRY_PROJECT_ID = "4511353159155792";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const envelope = body.split("\n");
    const header = JSON.parse(envelope[0] ?? "{}");

    const dsn = new URL(
      (header["dsn"] as string) ?? process.env.NEXT_PUBLIC_SENTRY_DSN ?? ""
    );

    if (dsn.hostname !== SENTRY_HOST) {
      return new Response("Invalid DSN host", { status: 400 });
    }

    const projectId = dsn.pathname.replace("/", "");
    if (projectId !== SENTRY_PROJECT_ID) {
      return new Response("Invalid project", { status: 403 });
    }

    const sentryRes = await fetch(
      `https://${SENTRY_HOST}/api/${projectId}/envelope/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-sentry-envelope" },
        body,
      }
    );

    return new Response(null, { status: sentryRes.status });
  } catch {
    return new Response("Tunnel error", { status: 500 });
  }
}
