import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseProvider } from "@/firebase/provider";
import SirajAiChat from "@/components/siraj-ai-chat";

export const metadata: Metadata = {
  metadataBase: new URL("https://siraj-app.vercel.app"),
  title: "منصة سراج التعليمية",
  description:
    "تعلم بأسلوب عملي ومبسط واكتسب المهارات التي تحتاج لها في سوق العمل.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    shortcut: "/favicon-96x96.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "سراج",
  },
  openGraph: {
    title: "منصة سراج التعليمية",
    description:
      "تعلم بأسلوب عملي ومبسط واكتسب المهارات التي تحتاج لها in سوق العمل.",
    url: "https://siraj-app.vercel.app",
    siteName: "منصة سراج التعليمية",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 800,
        alt: "شعار منصة سراج التعليمية",
      },
    ],
    locale: "ar_YE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "منصة سراج التعليمية",
    description:
      "تعلم بأسلوب عملي ومبسط واكتسب المهارات التي تحتاج لها في سوق العمل.",
    images: ["/logo.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#4A1F0F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Alexandria:wght@400;500;600;700&family=Cairo:wght@400;600;700&display=swap"
          rel="stylesheet"
          crossOrigin="anonymous"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <body className="font-body antialiased bg-background text-foreground selection:bg-secondary/30">
        <FirebaseProvider>
          <div className="relative min-h-screen">
            <main className="relative z-10">{children}</main>
            <Toaster />
            <SirajAiChat />
          </div>
        </FirebaseProvider>
      </body>
    </html>
  );
}
