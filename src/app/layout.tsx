import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";

export const metadata: Metadata = {
  title: {
    default: "SOLENE — Gestão funerária simples e organizada.",
    template: "%s · SOLENE",
  },
  description:
    "Do primeiro contato à despedida, acompanhe sua operação funerária com mais organização, segurança e tranquilidade.",
  manifest: "/manifest.json",
  applicationName: "SOLENE",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SOLENE",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#174C4F",
  width: "device-width",
  initialScale: 1,
  // Trava a escala em 100% para que todas as telas fiquem no mesmo zoom
  // (comportamento de aplicativo) e não haja zoom automático ao focar campos.
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Toaster />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
