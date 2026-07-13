/* Auth pages use a serif display face (Playfair Display) for the
   "Welcome Back" / quote typography from the reference design. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&display=swap"
      />
      {children}
    </>
  );
}
