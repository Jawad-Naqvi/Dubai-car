import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { RadialGlow, StarField } from "@/components/marketing/radial-glow";

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden bg-page">
      <StarField />
      <RadialGlow color="gold" size="xl" className="-top-40 -right-40 opacity-30" />
      <div className="relative text-center max-w-xl">
        <Eyebrow tone="gold">404</Eyebrow>
        <h1 className="mt-6 text-5xl lg:text-6xl font-light tracking-tight leading-[1.05]">
          This car has been <span className="font-extrabold">sold</span>.
        </h1>
        <p className="mt-6 text-secondary text-lg">
          The page you were looking for doesn't exist or has been moved.
        </p>
        <div className="mt-10 flex justify-center gap-3 flex-wrap">
          <Button asChild variant="gold" size="lg">
            <Link href="/">Back to home</Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/buy">Browse inventory</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
