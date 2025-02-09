import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ChatPopup } from "@/components/chat-popup";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Chatbot App",
  description: "An intelligent chatbot application powered by AI to help answer your questions and assist with tasks.",
  keywords: ["chatbot", "AI", "artificial intelligence", "customer support", "chat"],
  authors: [{ name: "AI Chatbot Team" }],
  icons: {
    icon: [
      {
        url: '/avatar.jpeg',
        type: 'image/jpeg',
      }
    ],
    shortcut: [
      {
        url: '/avatar.jpeg',
        type: 'image/jpeg',
      }
    ],
    apple: [
      {
        url: '/avatar.jpeg',
        type: 'image/jpeg',
      }
    ],
    other: [
      {
        rel: 'icon',
        url: '/avatar.jpeg',
        type: 'image/jpeg',
      }
    ]
  },
  openGraph: {
    title: "AI Chatbot App",
    description: "An intelligent chatbot application powered by AI to help answer your questions and assist with tasks.",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/avatar.jpeg",
        width: 1200,
        height: 630,
        alt: "AI Chatbot App",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Chatbot App",
    description: "An intelligent chatbot application powered by AI to help answer your questions and assist with tasks.",
    images: ["/avatar.jpeg"],
  },
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <ChatPopup />
        <Toaster/>
      </body>
    </html>
  );
}
