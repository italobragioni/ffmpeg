import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth";
import { OnboardingWizard } from "@/features/onboarding/onboarding-wizard";

export const metadata = { title: "Configuração inicial" };

export default async function OnboardingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Already has an organization -> straight to the app.
  const ctx = await getSessionContext();
  if (ctx) redirect("/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <OnboardingWizard
      defaultName={profile?.full_name ?? ""}
      defaultPhone={profile?.phone ?? ""}
      email={user.email ?? ""}
    />
  );
}
