import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "SmartBracket World Cup 2026",
  description:
    "Probabilistic bracket prediction engine for the 2026 FIFA World Cup. Statchance match-outcome model + Pickchance pool-strategy overlay from Supported Intelligence.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "SmartBracket World Cup 2026",
    description: "Build your bracket with Nate Silver-style match probabilities.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <Header />
        <main className="min-h-[calc(100vh-8rem)]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
