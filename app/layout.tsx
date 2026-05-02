import type { Metadata, Viewport } from "next";
import { Alfa_Slab_One, Oswald, Work_Sans } from "next/font/google";
import "./globals.css";

const alfa = Alfa_Slab_One({
  variable: "--ff-alfa",
  subsets: ["latin"],
  weight: "400",
});
const oswald = Oswald({
  variable: "--ff-oswald",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});
const workSans = Work_Sans({
  variable: "--ff-work",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Windmill Poker",
  description: "Score-Tracker für Windmill Poker",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Windmill Poker",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1E4A3C",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${alfa.variable} ${oswald.variable} ${workSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#1a1a2e] text-ink font-work">
        {children}
      </body>
    </html>
  );
}
