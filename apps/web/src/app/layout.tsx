import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import { PackProvider } from "@/lib/pack-context";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Enterprise Intelligence OS — AI that runs enterprise work",
  description:
    "Connect systems, ground answers in enterprise knowledge, orchestrate agents and governed workflows. Industry packs for Life Sciences, Banking, Insurance, and more.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <AuthProvider>
          <PackProvider>{children}</PackProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
