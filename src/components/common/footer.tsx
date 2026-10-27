"use client";
import { Facebook, Instagram } from "lucide-react";
import { useUIStore } from "@/store/ui";
import { translations } from "@/lib/i18n";

export function Footer() {
  const { lang } = useUIStore();
  const t = (k: any) => translations[lang][k] ?? k;
  return (
    <footer className="bg-white border-t mt-auto">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-2xl font-bold text-pink-600 font-serif">Skare</h2>
          <p className="max-w-md mx-auto mt-2 text-gray-500">
            {t("storeSlogan")}
          </p>
          <div className="flex mt-4 gap-6">
            <a
              href="#"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-pink-500 flex items-center gap-1"
            >
              <Facebook className="h-4 w-4" />
              {t("facebook")}
            </a>
            <a
              href="#"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-pink-500 flex items-center gap-1"
            >
              <Instagram className="h-4 w-4" />
              {t("instagram")}
            </a>
            <a
              href="#"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-pink-500"
            >
              {t("tiktok")}
            </a>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-4">
          <p className="text-center text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Skare. {t("rightsReserved")}
          </p>
        </div>
      </div>
    </footer>
  );
}
