"use client";
import { Suspense } from "react";
import { HomePageContent } from "@/components/shop/home-content";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="h-10 w-10 animate-spin text-pink-600" />
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
