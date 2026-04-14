import { redirect } from "next/navigation";

/**
 * Public-facing shortcut for the CRM surface.
 *
 * The CRM contacts view lives at /contacts inside the (app) group; this
 * redirect exists so links pointing at /crm resolve to 200 instead of
 * 404.
 */
export default function CrmRedirectPage() {
  redirect("/contacts");
}
