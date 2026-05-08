export function getRequestMeta(request: Request): {
  ipAddress: string;
  userAgent: string | null;
} {
  const xff = request.headers.get("x-forwarded-for");
  const ipAddress =
    (xff ? xff.split(",")[0].trim() : null) ??
    request.headers.get("x-real-ip") ??
    "0.0.0.0";

  const userAgent = request.headers.get("user-agent");
  return { ipAddress, userAgent };
}
