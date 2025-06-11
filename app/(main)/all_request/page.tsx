import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { RequestsTable } from "@/components/manager/RequestsTable";
import { ApprovedRejected } from "@/components/manager/ApprovedRejected";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { isRequestArray } from "@/lib/manager/action";
import { AdminRequestsTable } from "@/components/all_request/AdminRequestTable";
import { AdminApprovedRejected } from "@/components/all_request/AdminApprovedRejected";

export default async function AllRequest() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;

  if (!user) {
    return <p className="p-6 text-center">No session found.</p>;
  }

  const { data: userInfo } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

    if (!["Admin", "Manager"].includes(userInfo?.role)) {
        return <p className="p-6 text-center text-red-500">Access denied. Admins and Managers only.</p>;
      }
      

  const currentYear = new Date().getFullYear();
  const yearStart = `${currentYear}-01-01`;
  const yearEnd = `${currentYear}-12-31`;

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id");

  if (usersError) {
    return <p className="p-6 text-red-600">Error loading users: {usersError.message}</p>;
  }

  const teamCount = users?.length || 0;

  const { data: pendingRequests, error: pendingError } = await supabase
    .from("reimbursement_requests")
    .select("amount")
    .eq("status", "Pending")
    .gte("expense_date", yearStart)
    .lte("expense_date", yearEnd);

  if (pendingError) {
    return <p className="p-6 text-red-600">Error loading pending requests: {pendingError.message}</p>;
  }

  const pendingCount = pendingRequests?.length || 0;
  const totalPendingAmount = pendingRequests
    ?.map((r) => parseFloat(r.amount))
    .filter((amt) => !isNaN(amt))
    .reduce((sum, amt) => sum + amt, 0) ?? 0;

  const { data: approvedRequests, error: approvedError } = await supabase
    .from("reimbursement_requests")
    .select("amount")
    .eq("status", "Approved")
    .gte("expense_date", yearStart)
    .lte("expense_date", yearEnd);

  if (approvedError) {
    return <p className="p-6 text-red-600">Error loading approved requests: {approvedError.message}</p>;
  }

  const totalApprovedAmount = approvedRequests
    ?.map((r) => parseFloat(r.amount))
    .filter((amt) => !isNaN(amt))
    .reduce((sum, amt) => sum + amt, 0) ?? 0;

  const { data: rejectedRequests, error: rejectedError } = await supabase
    .from("reimbursement_requests")
    .select("amount")
    .eq("status", "Rejected")
    .gte("expense_date", yearStart)
    .lte("expense_date", yearEnd);

  if (rejectedError) {
    return <p className="p-6 text-red-600">Error loading rejected requests: {rejectedError.message}</p>;
  }

  const totalRejectedAmount = rejectedRequests
    ?.map((r) => parseFloat(r.amount))
    .filter((amt) => !isNaN(amt))
    .reduce((sum, amt) => sum + amt, 0) ?? 0;

  const { data: pendingRequestsWithDetails, error: allRequestsError } = await supabase
    .from("reimbursement_requests")
    .select("id, amount, status, expense_date, category, user_id, users:user_id(name), description, receipt_url, approval_comments, created_at")
    .eq("status", "Pending")
   
    .order("expense_date", { ascending: false });

  if (allRequestsError) {
    return <p className="p-6 text-red-600">Error loading requests: {allRequestsError.message}</p>;
  }

  const { data: approvedRejectedRequests, error: approvedRejectedError } = await supabase
    .from("reimbursement_requests")
    .select("id, amount, status, expense_date, category, user_id, users:user_id(name), description, receipt_url, approval_comments, created_at")
    .in("status", ["Approved", "Rejected"])
    .gte("expense_date", yearStart)
    .lte("expense_date", yearEnd);

  if (approvedRejectedError) {
    return <p className="p-6 text-red-600">Error loading approved/rejected requests: {approvedRejectedError.message}</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">All Reimbursement requests</h1>
      <p className="text-gray-600 mb-8">
        View all Reimbursement requests.
      </p>

      <div className="flex gap-6 flex-wrap mb-8">
        <Card className="flex-1 min-w-[250px]">
          <CardHeader>
            <CardTitle>Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{teamCount}</p>
          </CardContent>
          <CardDescription className="px-6 pb-4 text-gray-500">
            Total registered users
          </CardDescription>
        </Card>

        <Card className="flex-1 min-w-[250px]">
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingCount}</p>
          </CardContent>
          <CardDescription className="px-6 pb-4 text-gray-500">
            ₹{totalPendingAmount.toFixed(2)} pending in {currentYear}
          </CardDescription>
        </Card>

        <Card className="flex-1 min-w-[250px]">
          <CardHeader>
            <CardTitle>Approved Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{totalApprovedAmount.toFixed(2)}</p>
          </CardContent>
          <CardDescription className="px-6 pb-4 text-gray-500">
            Total approved
          </CardDescription>
        </Card>

        <Card className="flex-1 min-w-[250px]">
          <CardHeader>
            <CardTitle>Rejected Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{totalRejectedAmount.toFixed(2)}</p>
          </CardContent>
          <CardDescription className="px-6 pb-4 text-gray-500">
            Total rejected
          </CardDescription>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-3xl font-bold mb-6">All Requests</h2>
        <Tabs defaultValue="approvedRejected" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger value="approvedRejected" className="w-full">Approved & Rejected</TabsTrigger>
            <TabsTrigger value="pending" className="w-full">Pending</TabsTrigger>
          </TabsList>
          <TabsContent value="approvedRejected">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div>
                  <CardTitle className="text-2xl font-semibold">Approved and Rejected Requests</CardTitle>
                  <CardDescription>All processed requests</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <AdminApprovedRejected
                  requests={
                    approvedRejectedRequests?.map(req => ({
                      ...req,
                      users: Array.isArray(req.users)
                        ? req.users
                        : req.users
                          ? [req.users]
                          : [{ name: "Unknown" }]
                    })) || []
                  }
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="pending">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div>
                  <CardTitle className="text-2xl font-semibold">Pending Request</CardTitle>
                  <CardDescription>All pending request</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <AdminRequestsTable
                  requests={
                    pendingRequestsWithDetails?.map(req => ({
                      ...req,
                      users: Array.isArray(req.users)
                        ? req.users
                        : req.users
                          ? [req.users]
                          : [{ name: "Unknown" }]
                    })) || []
                  }
                />
              </CardContent>
            </Card>
          </TabsContent>

        
        </Tabs>
      </div>
    </div>
  );
}
