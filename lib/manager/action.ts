import { createClient } from "@/lib/supabase/server";

export async function fetchManagerDashboardData() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const managerId = session?.user.id;

  if (!managerId) {
    return { error: "No manager session found" };
  }

  const currentYear = new Date().getFullYear();
  const yearStart = `${currentYear}-01-01`;
  const yearEnd = `${currentYear}-12-31`;

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id")
    .eq("managerID", managerId);

  const teamCount = users?.length || 0;

  const { data: pendingRequests, error: pendingError } = await supabase
    .from("reimbursement_requests")
    .select("amount")
    .eq("approver", managerId)
    .eq("status", "Pending")
    .gte("expense_date", yearStart)
    .lte("expense_date", yearEnd);

  const pendingCount = pendingRequests?.length || 0;
  const totalPendingAmount = pendingRequests
    ?.map((r) => parseFloat(r.amount))
    .filter((amt) => !isNaN(amt))
    .reduce((sum, amt) => sum + amt, 0) ?? 0;

  const { data: approvedRequests, error: approvedError } = await supabase
    .from("reimbursement_requests")
    .select("amount")
    .eq("approver", managerId)
    .eq("status", "Approved")
    .gte("expense_date", yearStart)
    .lte("expense_date", yearEnd);

  const totalApprovedAmount = approvedRequests
    ?.map((r) => parseFloat(r.amount))
    .filter((amt) => !isNaN(amt))
    .reduce((sum, amt) => sum + amt, 0) ?? 0;

  const { data: pendingRequestsWithDetails, error: allRequestsError } = await supabase
    .from("reimbursement_requests")
    .select(
      "id, amount, status, expense_date, category, user_id, users(name), description, receipt_url, approval_comments, created_at"
    )
    .eq("approver", managerId)
    .eq("status", "Pending")
    .gte("expense_date", yearStart)
    .lte("expense_date", yearEnd)
    .order("expense_date", { ascending: false });

  const { data: approvedRejectedRequests, error: approvedRejectedError } = await supabase
    .from("reimbursement_requests")
    .select(
      "id, amount, status, expense_date, category, user_id, users(name), description, receipt_url, approval_comments, created_at"
    )
    .eq("approver", managerId)
    .in("status", ["Approved", "Rejected"]);

  return {
    managerId,
    currentYear,
    teamCount,
    pendingCount,
    totalPendingAmount,
    totalApprovedAmount,
    pendingRequestsWithDetails,
    approvedRejectedRequests,
    errors: {
      usersError,
      pendingError,
      approvedError,
      allRequestsError,
      approvedRejectedError,
    },
  };
}
export function isRequestArray(data: unknown): data is Request[] {
  return Array.isArray(data) && data.every(item => 
    item && 
    typeof item.id === 'string' &&
    Array.isArray(item.users)
  );
}