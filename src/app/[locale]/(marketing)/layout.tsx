import { Nav } from "@/components/marketing/nav";
import { Footer } from "@/components/marketing/footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-page overflow-x-hidden">
      <Nav />
      <main className="relative overflow-x-hidden">{children}</main>
      <Footer />
    </div>
  );
}
