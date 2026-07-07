import { SignUp } from "@clerk/nextjs";
import { RadialGlow, StarField } from "@/components/marketing/radial-glow";
import { brand } from "@/lib/brand";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 py-16 overflow-hidden">
      <StarField />
      <RadialGlow color="gold" size="xl" className="-top-40 -right-40 opacity-30" />
      <RadialGlow color="emerald" size="lg" className="-bottom-40 -left-40 opacity-30" />

      <div className="relative w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#D8B84E] to-[#A98F2E] flex items-center justify-center text-white font-black text-sm">
            DXB
          </div>
          <span className="text-[#1A1A1A] font-bold text-xl">{brand.name}</span>
        </Link>
        <SignUp appearance={{ elements: { rootBox: "mx-auto" } }} />
      </div>
    </div>
  );
}
