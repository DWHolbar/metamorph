import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Delta Reporter | Marketing-to-Engineering Coverage Gap',
  description:
    'Discover Trail of Bits tools with high GitHub activity that are missing blog coverage — your next marketing opportunity.',
  openGraph: {
    title: 'Delta Reporter',
    description: 'Marketing-to-Engineering Coverage Gap Analysis for Trail of Bits',
    type: 'website',
  },
};

const themeScript = `(function(){var t=localStorage.getItem('theme');if(t==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="dark"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
