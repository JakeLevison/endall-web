import { NextResponse } from "next/server";

// Centralized 501 response for the onboarding step endpoints. The backend
// write endpoints land in a separate session per the chief-of-staff scope
// doc (see docs/product/onboarding-page-scope.md in that repo, "Backend
// (chief-of-staff bridge)"). The frontend wizard treats 501 as accepted so
// it can scaffold end-to-end without the writes being wired.
export function notImplemented(step: string) {
  return NextResponse.json(
    {
      status: "not_implemented",
      step,
      message:
        "Onboarding write endpoints land in the chief-of-staff bridge (separate session).",
    },
    { status: 501 }
  );
}
