import { DashboardHeader } from "@/components/dashboard/header";
import { BannersManager } from "@/components/admin/banners-manager";
import { getBanners } from "@/lib/data/banners";

export default async function AdminBannersPage() {
  const banners = await getBanners();
  return (
    <>
      <DashboardHeader
        title="Banners"
        subtitle={`${banners.length} placement${banners.length === 1 ? "" : "s"} · homepage & category ads`}
      />
      <BannersManager banners={banners} />
    </>
  );
}
