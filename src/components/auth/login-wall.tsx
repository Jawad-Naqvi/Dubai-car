"use client";

import { SignIn } from "@clerk/nextjs";
import { Link } from "@/i18n/routing";
import { Modal } from "@/components/ui/modal";
import { clerkAuthAppearance } from "@/components/auth/auth-shell";

/**
 * In-place login wall. A blurred-backdrop modal that lets a signed-out user
 * authenticate WITHOUT leaving the page they're on (Clerk `routing="virtual"`
 * keeps the whole flow inside the modal). On success Clerk returns them to
 * `redirectUrl` — pass the current path so they land back exactly where they
 * were. Pair with a draft that survives the round-trip (e.g. sessionStorage)
 * so the in-progress action can be resumed seamlessly.
 */
export function LoginWall({
  open,
  onOpenChange,
  redirectUrl,
  title = "Sign in to continue",
  description = "Log in or create a free account to finish — your progress is saved.",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  redirectUrl: string;
  title?: string;
  description?: string;
}) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      className="max-w-md"
    >
      <div className="pt-1">
        <SignIn
          routing="virtual"
          appearance={clerkAuthAppearance}
          forceRedirectUrl={redirectUrl}
          signUpForceRedirectUrl={redirectUrl}
        />
        <p className="mt-4 text-center text-xs text-secondary">
          New to DXB Motors?{" "}
          <Link
            href="/sign-up?role=buyer"
            className="font-semibold text-[#141414] hover:text-[#C97612] transition-colors"
          >
            Create a free account
          </Link>
        </p>
      </div>
    </Modal>
  );
}
