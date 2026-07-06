"use client";

import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InscripcionRedirect from "@/components/InscripcionRedirect";

export default function InscripcionPendientePage() {
  return (
    <>
      <Navbar />
      <Suspense
        fallback={
          <div className="min-h-[30vh] flex items-center justify-center">
            <span className="text-5xl animate-bounce">🐴</span>
          </div>
        }
      >
        <InscripcionRedirect />
      </Suspense>
      <Footer />
    </>
  );
}
