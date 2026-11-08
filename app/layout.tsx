import type { Metadata } from "next";
import { Frank_Ruhl_Libre, Rubik } from "next/font/google";
import { DirectionProvider } from "@/components/ui/direction";
import "./globals.css";

const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  variable: "--font-sans",
  display: "swap",
});

const frank = Frank_Ruhl_Libre({
  subsets: ["hebrew", "latin"],
  weight: ["500", "700"],
  variable: "--font-frank",
  display: "swap",
});

export const metadata: Metadata = {
  title: "מסע החכמה",
  description: "למידה בבית עם נוגה, לשתי ילדות, בעברית.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="he" dir="rtl" className={`${rubik.variable} ${frank.variable} h-full antialiased`}>
      <body className="min-h-full">
        <DirectionProvider>{children}</DirectionProvider>
      </body>
    </html>
  );
}
