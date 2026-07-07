import Link from "next/link";
import { useTranslations } from "next-intl";
import { brand } from "@/lib/brand";
import {
  Linkedin,
  Instagram,
  Twitter,
  ShieldCheck,
  BadgeCheck,
  Lock,
  FileCheck,
} from "lucide-react";

export function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");

  return (
    <footer className="bg-white border-t border-[#E5E5E5] mt-16">
      <div className="mx-auto max-w-7xl px-4 lg:px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div className="col-span-2 md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#D8B84E] to-[#A98F2E] flex items-center justify-center text-white font-black text-[10px]">
                DXB
              </div>
              <span className="text-[#1A1A1A] font-bold text-base">{brand.name}</span>
            </div>
            <p className="text-xs text-secondary max-w-xs leading-relaxed">
              {t("tagline")}
            </p>
            <p className="mt-3 text-xs text-secondary">
              <a
                href={`mailto:${brand.email}`}
                className="hover:text-[#A98F2E] transition-colors"
              >
                {brand.email}
              </a>
            </p>
            <div className="mt-3 flex gap-2">
              <a
                href={brand.socials.linkedin}
                className="h-8 w-8 rounded-lg border border-[#E5E5E5] text-secondary flex items-center justify-center hover:border-[#C8A93E]/50 hover:text-[#A98F2E] transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-3.5 w-3.5" />
              </a>
              <a
                href={brand.socials.instagram}
                className="h-8 w-8 rounded-lg border border-[#E5E5E5] text-secondary flex items-center justify-center hover:border-[#C8A93E]/50 hover:text-[#A98F2E] transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-3.5 w-3.5" />
              </a>
              <a
                href={brand.socials.twitter}
                className="h-8 w-8 rounded-lg border border-[#E5E5E5] text-secondary flex items-center justify-center hover:border-[#C8A93E]/50 hover:text-[#A98F2E] transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-3 w-3" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-[#1A1A1A] text-[11px] font-semibold uppercase tracking-wider mb-3">
              {t("columns.marketplace")}
            </h4>
            <ul className="space-y-2 text-xs text-secondary">
              <li><Link href="/buy" className="hover:text-[#1A1A1A]">{tNav("buy")}</Link></li>
              <li><Link href="/sell" className="hover:text-[#1A1A1A]">{tNav("sell")}</Link></li>
              <li><Link href="/export" className="hover:text-[#1A1A1A]">{tNav("export")}</Link></li>
              <li><Link href="/valuation" className="hover:text-[#1A1A1A]">{tNav("valuation")}</Link></li>
              <li><Link href="/finance" className="hover:text-[#1A1A1A]">{tNav("finance")}</Link></li>
              <li><Link href="/inspection" className="hover:text-[#1A1A1A]">{tNav("inspection")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[#1A1A1A] text-[11px] font-semibold uppercase tracking-wider mb-3">
              {t("columns.platform")}
            </h4>
            <ul className="space-y-2 text-xs text-secondary">
              <li><Link href="/dealers" className="hover:text-[#1A1A1A]">{tNav("dealers")}</Link></li>
              <li><Link href="/pricing" className="hover:text-[#1A1A1A]">{tNav("pricing")}</Link></li>
              <li><Link href="/dashboard" className="hover:text-[#1A1A1A]">Dashboard</Link></li>
              <li><Link href="/api" className="hover:text-[#1A1A1A]">Developer API</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[#1A1A1A] text-[11px] font-semibold uppercase tracking-wider mb-3">
              {t("columns.company")}
            </h4>
            <ul className="space-y-2 text-xs text-secondary">
              <li><Link href="/about" className="hover:text-[#1A1A1A]">{tNav("about")}</Link></li>
              <li><Link href="/contact" className="hover:text-[#1A1A1A]">{tNav("contact")}</Link></li>
              <li><Link href="/blog" className="hover:text-[#1A1A1A]">Blog</Link></li>
              <li><Link href="/careers" className="hover:text-[#1A1A1A]">Careers</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-5 border-t border-[#E5E5E5] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted">
            <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-[#C8A93E]" />{t("trust.verified")}</span>
            <span className="inline-flex items-center gap-1"><BadgeCheck className="h-3 w-3 text-[#C8A93E]" />{t("trust.inspected")}</span>
            <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3 text-secondary" />{t("trust.gdpr")}</span>
            <span className="inline-flex items-center gap-1"><FileCheck className="h-3 w-3 text-[#C8A93E]" />{t("trust.rta")}</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-muted">
            <Link href="/privacy" className="hover:text-[#1A1A1A]">Privacy</Link>
            <Link href="/terms" className="hover:text-[#1A1A1A]">Terms</Link>
            <span>© {new Date().getFullYear()} {brand.name}. {t("rights")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
