import { redirect } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/admin");

  return (
    <PhoneFrame activeTab="admin">
      <div style={{ padding: "16px 14px 14px" }}>
        <div
          className="font-alfa text-forest"
          style={{ fontSize: 17, marginBottom: 4 }}
        >
          ADMIN-LOGIN
        </div>
        <div
          className="font-oswald text-mist"
          style={{
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          Nur für Frank
        </div>
        <LoginForm />
      </div>
    </PhoneFrame>
  );
}
