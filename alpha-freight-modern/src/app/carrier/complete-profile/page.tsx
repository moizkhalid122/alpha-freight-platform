"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CarrierCompleteProfilePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/carrier/dashboard");
  }, [router]);

  return null;
}
