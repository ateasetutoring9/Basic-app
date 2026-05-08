export function parseUserAgent(ua: string | null): { os: string; browser: string } {
  if (!ua) return { os: "Unknown", browser: "Other" };

  const os = /Mac OS X/i.test(ua)
    ? "macOS"
    : /Windows NT/i.test(ua)
    ? "Windows"
    : /iPhone|iPad/i.test(ua)
    ? "iOS"
    : /Android/i.test(ua)
    ? "Android"
    : /Linux/i.test(ua)
    ? "Linux"
    : "Unknown";

  // Order matters: Edge contains "Chrome", Chrome contains "Safari"
  const browser = /Edg\//i.test(ua)
    ? "Edge"
    : /Chrome/i.test(ua)
    ? "Chrome"
    : /Firefox/i.test(ua)
    ? "Firefox"
    : /Safari/i.test(ua)
    ? "Safari"
    : "Other";

  return { os, browser };
}
