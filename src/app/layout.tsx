import type {Metadata, Viewport} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseProvider } from "@/firebase/provider";

export const metadata: Metadata = {
  title: 'سراج | منصة سراج التعليمية',
  description: 'منصة تعليمية يمنية متقدمة لتعلم مهارات المستقبل برؤية عصرية وبسيطة.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-96x96.png',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'سراج',
  },
  openGraph: {
    title: 'منصة سراج التعليمية',
    description: 'اكتسب مهارات الغد مع خبراء الصناعة في بيئة تعليمية فاخرة وحديثة.',
    url: 'https://sira.vercel.app',
    siteName: 'سراج',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'شعار منصة سراج التعليمية',
      },
    ],
    locale: 'ar_YE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'منصة سراج التعليمية',
    description: 'منصة تعليمية يمنية لتعلم مهارات المستقبل.',
    images: ['/logo.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#4A1F0F',
  width: 'device-width',
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
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Alexandria:wght@400;500;600;700&family=Cairo:wght@400;600;700&display=swap" rel="stylesheet" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="font-body antialiased bg-background text-foreground selection:bg-secondary/30">
        <FirebaseProvider>
          <div className="relative min-h-screen">
            <main className="relative z-10">
              {children}
            </main>
            <Toaster />
          </div>
        </FirebaseProvider>
      </body>
    </html>
  );
}
