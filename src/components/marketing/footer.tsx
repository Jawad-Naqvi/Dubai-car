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

/* Charcoal multi-column footer — cars.com-style link directory */
export function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const locale = useLocale();

  const columns: {
    heading: string;
    links: { label: string; href: string }[];
  }[] = [
    {
      heading: "Shop",
      links: [
        { label: tNav("buy"), href: "/buy" },
        { label: "New Car Catalog", href: "/new-cars" },
        { label: "Compare cars", href: "/compare" },
        { label: "Saved cars", href: "/saved" },
        { label: tNav("dealers"), href: "/dealers" },
      ],
    },
    {
      heading: "Sell",
      links: [
        { label: tNav("sell"), href: "/sell" },
        { label: "Become a seller", href: "/sell/become-seller" },
        { label: tNav("valuation"), href: "/valuation" },
        { label: tNav("pricing"), href: "/pricing" },
      ],
    },
    {
      heading: "Tools & Services",
      links: [
        { label: tNav("finance"), href: "/finance" },
        { label: tNav("export"), href: "/export" },
        { label: "B2B Register", href: "/export/register" },
        { label: "Dashboard", href: "/dashboard" },
      ],
    },
    {
      heading: t("columns.company"),
      links: [
        { label: tNav("about"), href: "/about" },
        { label: tNav("contact"), href: "/contact" },
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
      ],
    },
  ];

  return (
    <footer className="bg-[#262626] text-white mt-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-6 pt-12 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand block */}
          <div className="col-span-2">
            <Link href="/" className="inline-block">
              <span className="font-extrabold text-2xl tracking-tight">
                {brand.name}
                <span className="text-[#AB74CF]">.</span>
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
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white transition-colors"
            >
              <Mail className="h-3 w-3" />
              {brand.email}
            </a>

            {/* Socials */}
            <div className="mt-5 flex items-center gap-3">
              <a
                href={brand.socials.linkedin}
                aria-label="LinkedIn"
                className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Linkedin className="h-3.5 w-3.5" />
              </a>
              <a
                href={brand.socials.instagram}
                aria-label="Instagram"
                className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Instagram className="h-3.5 w-3.5" />
              </a>
              <a
                href={brand.socials.twitter}
                aria-label="X / Twitter"
                className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Twitter className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <h4 className="text-xs font-bold mb-4 text-white">
                {col.heading}
              </h4>
              <ul className="space-y-2.5 text-xs text-white/60">
                {col.links.map((l) => (
                  <li key={`${col.heading}:${l.label}`}>
                    <Link
                      href={l.href}
                      className="hover:text-white hover:underline underline-offset-2 transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Trust strip */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-wrap items-center gap-4 text-[10px] text-white/45">
          <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-[#AB74CF]" />{t("trust.verified")}</span>
          <span className="inline-flex items-center gap-1"><BadgeCheck className="h-3 w-3 text-[#AB74CF]" />{t("trust.inspected")}</span>
          <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3" />{t("trust.gdpr")}</span>
          <span className="inline-flex items-center gap-1"><FileCheck className="h-3 w-3 text-[#AB74CF]" />{t("trust.rta")}</span>
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
