import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jimpitan RT 23 — RW 6 Munggut Peni",
  description: "Aplikasi pencatatan jimpitan mingguan RT 23 RW 6, Munggut Peni",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Jimpitan RT",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-100">
        {children}
      </body>
    </html>
  );
}
