import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEO Automation",
  description: "مرکز فرماندهی سئو",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "'Vazirmatn', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
