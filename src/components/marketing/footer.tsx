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
    <footer className="bg-[#050D0A] border-t border-white/5 mt-16">
      <div className="mx-auto max-w-7xl px-4 lg:px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div className="col-span-2 md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-6 w-6 rounded-sm bg-gradient-to-br from-[#F0CE5C] via-[#D4AF37] to-[#8C7220] flex items-center justify-center text-[#1A1208] font-black text-[10px]">
                DXB
              </div>
              <span className="text-white font-bold text-sm">{brand.name}</span>
            </div>
            <p className="text-xs text-secondary max-w-xs leading-relaxed">
              {t("tagline")}
            </p>
            <p className="mt-3 text-xs text-secondary">
              <a
                href={`mailto:${brand.email}`}
                className="hover:text-[#F0CE5C] transition-colors"
              >
                {brand.email}
              </a>
            </p>
            <div className="mt-3 flex gap-2">
              <a
                href={brand.socials.linkedin}
                className="h-7 w-7 rounded-sm border border-white/10 flex items-center justify-center hover:border-[#D4AF37]/40 hover:text-[#F0CE5C] transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-3 w-3" />
              </a>
              <a
                href={brand.socials.instagram}
                className="h-7 w-7 rounded-sm border border-white/10 flex items-center justify-center hover:border-[#D4AF37]/40 hover:text-[#F0CE5C] transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-3 w-3" />
              </a>
              <a
                href={brand.socials.twitter}
                className="h-7 w-7 rounded-sm border border-white/10 flex items-center justify-center hover:border-[#D4AF37]/40 hover:text-[#F0CE5C] transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-3 w-3" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white text-[11px] font-semibold uppercase tracking-wider mb-3">
              {t("columns.marketplace")}
            </h4>
            <ul className="space-y-2 text-xs text-secondary">
              <li><Link href="/buy" className="hover:text-white">{tNav("buy")}</Link></li>
              <li><Link href="/sell" className="hover:text-white">{tNav("sell")}</Link></li>
              <li><Link href="/export" className="hover:text-white">{tNav("export")}</Link></li>
              <li><Link href="/valuation" className="hover:text-white">{tNav("valuation")}</Link></li>
              <li><Link href="/finance" className="hover:text-white">{tNav("finance")}</Link></li>
              <li><Link href="/inspection" className="hover:text-white">{tNav("inspection")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-[11px] font-semibold uppercase tracking-wider mb-3">
              {t("columns.platform")}
            </h4>
            <ul className="space-y-2 text-xs text-secondary">
              <li><Link href="/dealers" className="hover:text-white">{tNav("dealers")}</Link></li>
              <li><Link href="/pricing" className="hover:text-white">{tNav("pricing")}</Link></li>
              <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
              <li><Link href="/api" className="hover:text-white">Developer API</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-[11px] font-semibold uppercase tracking-wider mb-3">
              {t("columns.company")}
            </h4>
            <ul className="space-y-2 text-xs text-secondary">
              <li><Link href="/about" className="hover:text-white">{tNav("about")}</Link></li>
              <li><Link href="/contact" className="hover:text-white">{tNav("contact")}</Link></li>
              <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
              <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-5 border-t border-white/5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted">
            <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-[#F0CE5C]" />{t("trust.verified")}</span>
            <span className="inline-flex items-center gap-1"><BadgeCheck className="h-3 w-3 text-[#F0CE5C]" />{t("trust.inspected")}</span>
            <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3 text-[#C4D1CB]" />{t("trust.gdpr")}</span>
            <span className="inline-flex items-center gap-1"><FileCheck className="h-3 w-3 text-[#F0CE5C]" />{t("trust.rta")}</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-muted">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <span>© {new Date().getFullYear()} {brand.name}. {t("rights")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
