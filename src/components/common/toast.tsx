"use client";
import { useUIStore } from "@/store/ui";
import { CheckCircle2, XCircle } from "lucide-react";

export function ToastContainer() {
  const { toast, clearToast } = useUIStore();
  if (!toast) return null;
  return (
    <div className="fixed top-4 inset-x-0 flex justify-center z-[100] pointer-events-none">
      <div
        className={`pointer-events-auto px-5 py-3 rounded-lg shadow-xl text-white flex items-center gap-2 max-w-md ${
          toast.type === "success" ? "bg-green-600" : "bg-red-600"
        }`}
        role="alert"
      >
        {toast.type === "success" ? (
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
        ) : (
          <XCircle className="h-5 w-5 flex-shrink-0" />
        )}
        <span className="text-sm font-medium">{toast.message}</span>
        <button
          onClick={clearToast}
          className="ms-2 text-white/80 hover:text-white text-xl leading-none"
          aria-label="close"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
