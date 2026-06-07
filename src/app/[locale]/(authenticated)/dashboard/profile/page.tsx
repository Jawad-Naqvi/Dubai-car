import { DashboardHeader } from "@/components/dashboard/header";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { getDealerProfile } from "@/lib/data/dealer-profile";

export default async function DealerProfilePage() {
  const profile = await getDealerProfile();
  return (
    <>
      <DashboardHeader
        title="Dealer profile"
        subtitle="Your public storefront branding & contact details"
      />
      <main className="p-5">
        <ProfileForm profile={profile} />
      </main>
    </>
  );
}
