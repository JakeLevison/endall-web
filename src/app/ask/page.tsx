import { redirect } from "next/navigation";

/**
 * Public-facing shortcut for the Ask Endall workspace.
 *
 * The actual page lives under the authenticated (app) group at
 * /dashboard/ask-endall; this redirect exists so links and nav items
 * pointing at /ask resolve to 200 instead of 404.
 */
export default function AskRedirectPage() {
  redirect("/dashboard/ask-endall");
}
