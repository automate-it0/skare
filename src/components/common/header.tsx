"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  ShoppingBag,
  User,
  Search,
  Globe,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useUIStore } from "@/store/ui";
import { translations } from "@/lib/i18n";

export function Header({ cartCount }: { cartCount: number }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { lang, toggleLang } = useUIStore();
  const t = (k: any) => translations[lang][k] ?? k;
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = (session?.user as any)?.role === "ADMIN";

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/?q=${encodeURIComponent(search)}`);
  };

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b">
      <nav className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="menu"
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>
          <Link
            href="/"
            className="text-3xl font-bold text-pink-600 tracking-wider font-serif"
          >
            Skare
          </Link>
        </div>

        <form
          onSubmit={onSearch}
          className="hidden md:flex flex-grow items-center justify-center max-w-lg mx-4"
        >
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full"
              maxLength={100}
            />
          </div>
        </form>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLang}
            title="Language"
            className="flex items-center gap-1"
          >
            <Globe className="h-5 w-5" />
            <span className="font-semibold text-sm">
              {lang === "ar" ? "EN" : "AR"}
            </span>
          </Button>

          <Link href="/cart" className="relative" title={t("shoppingCart")}>
            <Button variant="ghost" size="sm" className="relative">
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-[10px] rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Button>
          </Link>

          {status === "authenticated" ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" title={t("myAccount")}>
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className={lang === "ar" ? "text-right" : "text-left"}
              >
                <div className="px-3 py-2 text-xs text-gray-500 truncate max-w-[200px]">
                  {session.user?.email}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/account")}>
                  <User className="h-4 w-4 me-2" />
                  {t("myAccount")}
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                    <LayoutDashboard className="h-4 w-4 me-2" />
                    {t("dashboard")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-red-600"
                >
                  <LogOut className="h-4 w-4 me-2" />
                  {t("logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth">
              <Button variant="ghost" size="sm" title={t("login")}>
                <User className="h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile search */}
      {mobileOpen && (
        <div className="md:hidden border-t p-3 bg-white">
          <form onSubmit={onSearch} className="flex gap-2">
            <Input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              maxLength={100}
            />
            <Button type="submit" size="sm">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </header>
  );
}
