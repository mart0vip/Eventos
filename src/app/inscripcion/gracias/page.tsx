"use client";

import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InscripcionGraciasContent from "@/components/InscripcionGraciasContent";

export default function InscripcionGraciasPage() {
  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Suspense
          fallback={
            <div className="min-h-[30vh] flex items-center justify-center">
              <span className="text-5xl animate-bounce">🐴</span>
            </div>
          }
        >
          <InscripcionGraciasContent />
        </Suspense>
      </div>
      <Footer />
    </>
  );
}
