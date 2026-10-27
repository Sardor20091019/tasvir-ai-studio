import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '../lib/theme';

export const metadata: Metadata = {
  title: 'TASVIR — Cinematic AI Video Engine',
  description:
    'Professional-grade AI video generation platform. Cinematic storytelling powered by next-generation AI. Built for filmmakers, designers, and serious creators.',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%230F1013"/><path d="M38 30L72 50L38 70Z" fill="%23D4A574"/></svg>',
  },
};

const themeInitScript = `
(function() {
  try {
    var storedTheme = localStorage.getItem('tasvir-theme');
    var theme = (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') ? storedTheme : 'system';
    var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-obsidian text-ink antialiased min-h-screen">
        <ThemeProvider defaultTheme="system">
          <div className="film-grain" />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
