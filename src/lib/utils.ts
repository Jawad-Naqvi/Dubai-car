import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAED(value: number, locale: "en" | "ar" = "en"): string {
  const formatted = new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(value);
  return formatted;
}

export function formatKm(value: number, locale: "en" | "ar" = "en"): string {
  const n = new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-AE").format(value);
  return locale === "ar" ? `${n} كم` : `${n} km`;
}

export function formatNumber(value: number, locale: "en" | "ar" = "en"): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-AE").format(value);
}

export function slugify(...parts: (string | number)[]) {
  return parts
    .map(String)
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function whatsappLink(phone: string, message?: string) {
  const cleaned = phone.replace(/[^0-9]/g, "");
  const base = `https://wa.me/${cleaned}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function monthlyEMI(priceAED: number, years = 4, apr = 0.04) {
  const months = years * 12;
  const monthlyRate = apr / 12;
  if (monthlyRate === 0) return Math.round(priceAED / months);
  const emi =
    (priceAED * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);
  return Math.round(emi);
}
