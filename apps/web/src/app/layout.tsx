import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tasvir — AI Video Reklama & UGC Studiyasi | Uzum, Reels, Telegram',
  description:
    'Oʻzbekiston elektron tijorat doʻkonlari uchun 60 soniyada sunʼiy intellekt orqali 9:16 vertikal video reklamalar va mahalliy UGC roliklar yaratish studiyasi.',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="24" fill="%23EA580C"/><path d="M38 30L72 50L38 70Z" fill="white"/></svg>',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <body className="bg-canvas text-ink antialiased selection:bg-coral-light selection:text-coral">
        {children}
      </body>
    </html>
  );
}

