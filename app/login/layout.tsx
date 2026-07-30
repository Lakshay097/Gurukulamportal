import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - The Gurukulam School",
  description: "Sign in to access the Gurukulam School portal",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
