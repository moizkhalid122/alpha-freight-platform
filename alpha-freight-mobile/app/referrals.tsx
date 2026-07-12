import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import CarrierReferralsScreen from "@/components/referrals/CarrierReferralsScreen";
import SupplierReferralsScreen from "@/components/supplier/SupplierReferralsScreen";
import { getUserRole } from "@/lib/user-role";
import { supabase } from "@/lib/supabase";
import { colors } from "@/lib/theme";

export default function ReferralsPage() {
  const [role, setRole] = useState<"carrier" | "supplier" | null>(null);

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setRole("carrier");
        return;
      }
      const resolved = await getUserRole(user.id);
      setRole(resolved);
    })();
  }, []);

  if (!role) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white }}>
        <ActivityIndicator color={colors.ink} />
      </View>
    );
  }

  return role === "supplier" ? <SupplierReferralsScreen /> : <CarrierReferralsScreen />;
}
