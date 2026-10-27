"use client";
import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/store/ui";
import { translations } from "@/lib/i18n";
import { api, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const { lang, notify } = useUIStore();
  const t = (k: any) => translations[lang][k] ?? k;
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    address: "",
  });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const res = await signIn("credentials", {
          email: form.email,
          password: form.password,
          redirect: false,
        });
        if (!res || res.error) {
          if (res?.error === "BLOCKED") notify("error", t("blockedAccount"));
          else notify("error", t("authError"));
          return;
        }
        notify("success", t("loginSuccess"));
        router.push("/");
        router.refresh();
      } else {
        if (!/^(010|011|012|015)\d{8}$/.test(form.phone)) {
          notify("error", t("invalidPhoneError"));
          return;
        }
        if (form.password.length < 8) {
          notify("error", t("passwordTooShort"));
          return;
        }
        try {
          await api.post("/api/auth/signup", {
            email: form.email,
            password: form.password,
            fullName: form.fullName,
            phone: form.phone,
            address: form.address,
          });
        } catch (e) {
          // If user already exists, fall through to login
          if (!(e instanceof ApiError && e.status === 409)) {
            if (e instanceof ApiError && e.status === 429) {
              notify("error", t("rateLimitError"));
            } else if (e instanceof ApiError && e.status === 422) {
              notify("error", t("invalidPhoneError"));
            } else {
              notify("error", t("authError"));
            }
            return;
          }
        }
        // Auto login (either after fresh signup or because user already existed)
        const res = await signIn("credentials", {
          email: form.email,
          password: form.password,
          redirect: false,
        });
        if (res?.error) {
          notify("error", t("authError"));
          return;
        }
        notify("success", t("signupSuccess"));
        router.push("/");
        router.refresh();
      }
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 409) notify("error", t("userAlreadyRegisteredError"));
        else if (e.status === 429) notify("error", t("rateLimitError"));
        else if (e.status === 422) notify("error", t("invalidPhoneError"));
        else notify("error", t("authError"));
      } else {
        notify("error", t("authError"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-100px)] bg-pink-50/50 py-12">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg">
        <h2 className="text-3xl font-extrabold text-center text-gray-900">
          {isLogin ? t("loginTitle") : t("signupTitle")}
        </h2>
        <form className="space-y-4" onSubmit={onSubmit}>
          {!isLogin && (
            <>
              <div>
                <Label htmlFor="fullName">{t("fullNamePlaceholder")}</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  maxLength={200}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">{t("phonePlaceholder")}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="01012345678"
                  pattern="^(010|011|012|015)\d{8}$"
                  maxLength={11}
                  required
                />
              </div>
              <div>
                <Label htmlFor="address">{t("addressPlaceholder")}</Label>
                <Input
                  id="address"
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  maxLength={500}
                  required
                />
              </div>
            </>
          )}
          <div>
            <Label htmlFor="email">{t("emailPlaceholder")}</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              maxLength={254}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">{t("passwordPlaceholder")}</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={isLogin ? 1 : 8}
              maxLength={128}
              required
            />
            {!isLogin && (
              <p className="text-xs text-gray-500 mt-1">
                {t("passwordTooShort")}
              </p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full bg-pink-600 hover:bg-pink-700"
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
            {isLogin ? t("loginButton") : t("signupButton")}
          </Button>
        </form>
        <div className="text-sm text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-medium text-pink-600 hover:text-pink-500"
          >
            {isLogin ? t("switchToSignup") : t("switchToLogin")}
          </button>
        </div>
      </div>
    </div>
  );
}
