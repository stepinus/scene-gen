import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Генератор Видео | Создайте потрясающие видео из изображений",
  description: "Превратите ваши изображения в потрясающие AI видео с помощью текстового описания сцены. Быстро, просто и качественно.",
  keywords: ["AI видео", "генератор видео", "искусственный интеллект", "обработка изображений"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geist.variable} ${geistMono.variable} antialiased min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950`}
      >
        <div className="min-h-screen flex flex-col">
          {children}
          
          {/* Футер */}
          <footer className="mt-auto border-t bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-6">
              <div className="text-center text-sm text-muted-foreground">
                <p>© 2024 AI Генератор Видео. Создано с помощью Next.js и shadcn/ui</p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
