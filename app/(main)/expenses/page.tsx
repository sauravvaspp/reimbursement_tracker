import SubmitExpense from "@/components/expenses/SubmitExpense";
import { createClient } from "@/lib/supabase/server";

export default async function Expences() {
  const supabase = await createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  
  // const { data: instruments } = await supabase.from("instruments").select();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Submit Expense</h1>
        <p className="text-muted-foreground">Submit a new expense for reimbursement</p>
      </div>
      <SubmitExpense userId={session?.user.id ?? null} />
    </div>
  );
}
