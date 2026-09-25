import { Logo } from "@/components/brand/logo";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { AcceptInvite } from "@/features/equipe/accept-invite";
import type { Role } from "@/lib/constants";

export const metadata = { title: "Convite" };

export default async function ConvitePage({ params }: { params: { token: string } }) {
  const supabase = createClient();
  const [{ data: inviteRows }, { data: userData }] = await Promise.all([
    supabase.rpc("get_invitation", { p_token: params.token }),
    supabase.auth.getUser(),
  ]);

  const invite = (inviteRows as {
    organization_id: string;
    organization_name: string;
    role: Role;
    email: string | null;
    expired: boolean;
  }[])?.[0];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>
        <Card>
          <CardContent className="p-6">
            {!invite ? (
              <p className="text-center text-sm text-muted-foreground">
                Convite não encontrado.
              </p>
            ) : invite.expired ? (
              <p className="text-center text-sm text-muted-foreground">
                Este convite expirou ou já foi utilizado. Peça um novo à sua funerária.
              </p>
            ) : (
              <AcceptInvite
                token={params.token}
                orgName={invite.organization_name}
                role={invite.role}
                isAuthed={!!userData.user}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
