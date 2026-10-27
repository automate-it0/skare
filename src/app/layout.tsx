import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "./providers";
import { ToastContainer } from "@/components/common/toast";
import { ShopShell } from "@/components/common/shop-shell";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "متجر Skare | منتجات العناية الفاخرة",
  description: "متجرك الأول لمنتجات العناية الفاخرة - Skare Store",
  keywords: ["Skare", "متجر", "عناية", "تجميل", "مستحضرات"],
  authors: [{ name: "Skare" }],
  icons: { icon: "/logo.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} font-sans antialiased bg-gray-50 text-gray-900`}
      >
        <Providers>
          <ShopShell>{children}</ShopShell>
          <ToastContainer />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
