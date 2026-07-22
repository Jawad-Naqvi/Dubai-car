import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { brand } from "@/lib/brand";
import {
  Linkedin,
  Instagram,
  Twitter,
  Mail,
  Globe,
  ShieldCheck,
  BadgeCheck,
  Lock,
  FileCheck,
} from "lucide-react";

/* Dark navy footer — Meher reference style */
export function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const locale = useLocale();

  return (
    <footer className="bg-[#181C30] text-white mt-20 rounded-t-[2rem]">
      <div className="mx-auto max-w-7xl px-4 lg:px-6 pt-14 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand block */}
          <div className="col-span-2">
            <Link href="/" className="inline-block">
              <span className="font-extrabold text-2xl tracking-tight">
                {brand.name}
                <span className="text-[#F0941F]">.</span>
              </span>
            </Link>
            <p className="mt-3 text-xs text-white/60 max-w-xs leading-relaxed">
              {t("tagline")}
            </p>
            <p className="mt-5 text-xs text-white/60 leading-relaxed">
              Jebel Ali Free Zone
              <br />
              Dubai, United Arab Emirates
            </p>
            <a
              href={`mailto:${brand.email}`}
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-[#F0941F] transition-colors"
            >
              <Mail className="h-3 w-3" />
              {brand.email}
            </a>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider mb-4 text-white/90">
              {t("columns.marketplace")}
            </h4>
            <ul className="space-y-2.5 text-xs text-white/55">
              <li><Link href="/buy" className="hover:text-white transition-colors">{tNav("buy")}</Link></li>
              <li><Link href="/sell" className="hover:text-white transition-colors">{tNav("sell")}</Link></li>
              <li><Link href="/export" className="hover:text-white transition-colors">{tNav("export")}</Link></li>
              <li><Link href="/valuation" className="hover:text-white transition-colors">{tNav("valuation")}</Link></li>
              <li><Link href="/finance" className="hover:text-white transition-colors">{tNav("finance")}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider mb-4 text-white/90">
              {t("columns.platform")}
            </h4>
            <ul className="space-y-2.5 text-xs text-white/55">
              <li><Link href="/dealers" className="hover:text-white transition-colors">{tNav("dealers")}</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">{tNav("pricing")}</Link></li>
              <li><Link href="/new-cars" className="hover:text-white transition-colors">New Car Catalog</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider mb-4 text-white/90">
              {t("columns.company")}
            </h4>
            <ul className="space-y-2.5 text-xs text-white/55">
              <li><Link href="/about" className="hover:text-white transition-colors">{tNav("about")}</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">{tNav("contact")}</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Service Discount</Link></li>
              <li><Link href="/export/register" className="hover:text-white transition-colors">B2B Register</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider mb-4 text-white/90">
              {t("columns.follow")}
            </h4>
            <ul className="space-y-2.5 text-xs text-white/55">
              <li>
                <a href={brand.socials.linkedin} className="inline-flex items-center gap-2 hover:text-white transition-colors">
                  <Linkedin className="h-3 w-3" /> LinkedIn
                </a>
              </li>
              <li>
                <a href={brand.socials.instagram} className="inline-flex items-center gap-2 hover:text-white transition-colors">
                  <Instagram className="h-3 w-3" /> Instagram
                </a>
              </li>
              <li>
                <a href={brand.socials.twitter} className="inline-flex items-center gap-2 hover:text-white transition-colors">
                  <Twitter className="h-3 w-3" /> X / Twitter
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Trust strip */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-wrap items-center gap-4 text-[10px] text-white/45">
          <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-[#F0941F]" />{t("trust.verified")}</span>
          <span className="inline-flex items-center gap-1"><BadgeCheck className="h-3 w-3 text-[#F0941F]" />{t("trust.inspected")}</span>
          <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3" />{t("trust.gdpr")}</span>
          <span className="inline-flex items-center gap-1"><FileCheck className="h-3 w-3 text-[#F0941F]" />{t("trust.rta")}</span>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 pt-6 border-t border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <span className="text-[10px] text-white/45">
            © {new Date().getFullYear()} {brand.name}. {t("rights")}
          </span>
          <div className="flex items-center gap-5 text-[10px] text-white/45">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-2.5 py-1 text-white/60">
              <Globe className="h-3 w-3" />
              {locale === "ar" ? "العربية" : "English"}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
