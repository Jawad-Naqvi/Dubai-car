import { DashboardHeader } from "@/components/dashboard/header";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { IdentityDocuments } from "@/components/account/identity-documents";
import { getDealerProfile } from "@/lib/data/dealer-profile";

export default async function DealerProfilePage() {
  const profile = await getDealerProfile();
  return (
    <>
      <DashboardHeader
        title="Dealer profile"
        subtitle="Your public storefront branding & contact details"
      />
      <main className="p-5 space-y-5">
        <ProfileForm profile={profile} />
        <div className="max-w-3xl">
          <IdentityDocuments
            mode="dealer"
            initial={{
              emiratesIdNumber: profile.emiratesIdNumber,
              emiratesIdFrontUrl: profile.emiratesIdFrontUrl,
              emiratesIdBackUrl: profile.emiratesIdBackUrl,
              tradeLicense: profile.tradeLicense,
              tradeLicenseDocUrl: profile.tradeLicenseDocUrl,
            }}
          />
        </div>
      </main>
    </>
  );
}
