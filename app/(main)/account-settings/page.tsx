import { createClient } from "@/lib/supabase/server";

export default async function AccountSetting() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data: instruments } = await supabase.from("instruments").select();

  return (
    <>
      <p>userId = {session?.user.id}</p>
      <pre>{JSON.stringify(instruments, null, 2)}</pre>
    </>
  );
}
