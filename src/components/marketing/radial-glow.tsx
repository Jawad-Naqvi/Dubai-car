/**
 * Flat design language: decorative background glows and star fields are
 * retired — surfaces stay plain. The components are kept as no-ops so the
 * many existing call sites remain valid; remove call sites opportunistically.
 */

export function RadialGlow(_props: {
  className?: string;
  color?: "gold" | "emerald" | "white";
  size?: "sm" | "md" | "lg" | "xl";
}) {
  return null;
}

export function StarField(_props: { className?: string }) {
  return null;
}
