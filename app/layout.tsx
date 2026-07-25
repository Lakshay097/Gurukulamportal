import type { Metadata } from "next";
import { Alegreya, Work_Sans, IBM_Plex_Mono } from "next/font/google";
import "../styles/globals.css";
import { StickyNav } from "@/components/sticky-nav";
import Providers from "@/components/providers";

const alegreya = Alegreya({
  variable: "--font-alegreya",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["italic"],
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "The Gurukulam School - Portal",
  description: "Empowering education across India through centralized knowledge management and collaborative excellence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${alegreya.variable} ${workSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <StickyNav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
