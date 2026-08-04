"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { hydrateProfileExtras } from "@/lib/profile-extras";

type ProfileExtrasHydratorProps = {
  role: "carrier" | "supplier";
};

export default function ProfileExtrasHydrator({ role }: ProfileExtrasHydratorProps) {
  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active || !user) return;
      await hydrateProfileExtras(user.id, role);
    };

    void hydrate();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active || !session?.user) return;
      void hydrateProfileExtras(session.user.id, role);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [role]);

  return null;
}
