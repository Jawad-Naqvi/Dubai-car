import { Nav } from "@/components/marketing/nav";
import { Footer } from "@/components/marketing/footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // NOTE: no `overflow-x-hidden` here. An intermediate ancestor with
    // overflow-x:hidden computes overflow-y:auto, becoming a scroll container
    // that silently breaks `position: sticky` for every descendant (the filter
    // rail, the listing right rail, the nav). Horizontal scroll is already
    // prevented globally by html/body in globals.css, which is sticky-safe
    // because root/body overflow propagates to the viewport.
    <div className="relative min-h-screen bg-page">
      <Nav />
      <main className="relative">{children}</main>
      <Footer />
    </div>
  );
}
