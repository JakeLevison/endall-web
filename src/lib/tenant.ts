export function getTenantIdFromCookie(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)tenant_id=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}
