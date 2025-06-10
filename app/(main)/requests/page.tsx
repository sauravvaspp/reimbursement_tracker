import RequestContainer from "@/components/requests/RequestContainer";
import { createClient } from "@/lib/supabase/server";

export default async function Request() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  return <RequestContainer userId={session?.user.id ?? null} />;
}