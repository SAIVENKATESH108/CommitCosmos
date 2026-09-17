import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { Toaster } from 'sonner';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

const productionBaseUrl =
  process.env.NEXT_PUBLIC_APP_URL || 'https://commitcosmos.vercel.app';

export const viewport: Viewport = {
  themeColor: '#000000',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(productionBaseUrl),
  title: {
    default: 'CommitCosmos — grow your coding galaxy',
    template: '%s | CommitCosmos',
  },
  description:
    'Turn your GitHub commit history into an interactive 3D galaxy: every commit lights a star, every daily streak connects stars into a constellation.',
  keywords: [
    'GitHub',
    '3D Galaxy',
    'Commit Visualization',
    'WebGL',
    'Three.js',
    'React Three Fiber',
    'Developer Portfolio',
  ],
  authors: [{ name: 'CommitCosmos Team' }],
  creator: 'CommitCosmos',
  publisher: 'CommitCosmos',
  openGraph: {
    title: 'CommitCosmos — grow your coding galaxy',
    description:
      'Transform your GitHub commit history into an interactive 3D galaxy of stars and constellations.',
    url: productionBaseUrl,
    siteName: 'CommitCosmos',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'CommitCosmos — Interactive 3D GitHub Galaxy',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CommitCosmos — grow your coding galaxy',
    description:
      'Transform your GitHub commit history into an interactive 3D galaxy of stars and constellations.',
    images: ['/og-default.png'],
    creator: '@commitcosmos',
  },
  icons: {
    icon: [
      { url: '/commitcosmos_logo.png', sizes: '512x512', type: 'image/png' },
      { url: '/commitcosmos_favicon_512.png', sizes: '512x512', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/commitcosmos_logo.png',
    apple: '/apple-touch-icon.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-black text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200`}
      >
        <QueryProvider>
          {children}
          <Toaster
            theme="dark"
            position="top-center"
            toastOptions={{
              className:
                '!bg-black/90 !backdrop-blur-xl !border !border-white/15 !text-slate-100 !shadow-2xl !shadow-black/80 !rounded-xl',
              duration: 4000,
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
