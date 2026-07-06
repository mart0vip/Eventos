"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/** Thin redirect used by /inscripcion/error and /inscripcion/pendiente — both just
 * forward the same `?id=` to /inscripcion/gracias, which owns the actual
 * status-polling/branching logic (spec: "redirigen a /inscripcion/gracias con
 * el mismo id"). */
export default function InscripcionRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  useEffect(() => {
    router.replace(id ? `/inscripcion/gracias?id=${id}` : "/inscripcion/gracias");
  }, [id, router]);

  return (
    <div className="min-h-[30vh] flex items-center justify-center">
      <span className="text-5xl animate-bounce">🐴</span>
    </div>
  );
}
