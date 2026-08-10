import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gus English School",
  description: "O método definitivo para você destravar seu inglês.",
  manifest: "/manifest.json",
  themeColor: "#0033A0",
  icons: {
    icon: '/logofavicon.png',
    apple: '/logoapp.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-full flex flex-col`}
      >
        <Toaster position="top-right" toastOptions={{
          style: {
            background: 'var(--primary-blue)',
            color: '#fff',
            borderRadius: '12px',
          },
        }} />
        {children}
      </body>
    </html>
  );
}
