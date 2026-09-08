import { redirect } from "next/navigation";
import { resolvePostAuthPath } from "@/lib/data/onboarding";

/**
 * The single front door's landing strip.
 *
 * Every account — buyer, dealer, freight forwarder, admin — signs in at the
 * same /sign-in page. This is the one place that decides where they go next,
 * based on the organization they belong to rather than on anything the visitor
 * could have put in a URL. New accounts land on /welcome to say what they're
 * here to do.
 */
export default async function PostAuthPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(await resolvePostAuthPath(locale));
}
