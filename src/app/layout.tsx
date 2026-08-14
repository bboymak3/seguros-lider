import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Seguros Líder — Gestión de Pólizas Vehiculares",
  description: "Plataforma digital para solicitud, gestión y verificación de pólizas de seguro vehicular. Certificados con código QR de verificación instantánea.",
  keywords: ["seguros", "póliza", "vehicular", "certificado", "QR", "verificación", "caracas", "venezuela"],
  authors: [{ name: "Seguros Líder" }],
  openGraph: {
    title: "Seguros Líder — Gestión de Pólizas",
    description: "Solicitud, gestión y verificación de pólizas de seguro vehicular con QR.",
    siteName: "Seguros Líder",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Seguros Líder",
    description: "Gestión de pólizas vehiculares con verificación QR.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster position="top-right" richColors />
      </body>
    </html>
  );
}
