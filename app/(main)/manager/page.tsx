import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { BulkActions } from "@/components/manager/BulkActions";
import { RequestsTable } from "@/components/manager/RequestsTable";
import { ApprovedRejected } from "@/components/manager/ApprovedRejected";
import {  Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { isRequestArray } from "@/lib/manager/action";

export default async function ManagerDashboard() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const managerId = session?.user.id;

  if (!managerId) {
    return <p className="p-6 text-center">No manager session found.</p>;
  }

  const currentYear = new Date().getFullYear();
  const yearStart = `${currentYear}-01-01`;
  const yearEnd = `${currentYear}-12-31`;

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id")
    .eq("managerID", managerId);

  if (usersError) {
    return <p className="p-6 text-red-600">Error loading users: {usersError.message}</p>;
  }

  const teamCount = users?.length || 0;

  const { data: pendingRequests, error: pendingError } = await supabase
    .from("reimbursement_requests")
    .select("amount")
    .eq("approver", managerId)
    .eq("status", "Pending")
    .gte("expense_date", yearStart)
    .lte("expense_date", yearEnd);

  if (pendingError) {
    return <p className="p-6 text-red-600">Error loading pending requests: {pendingError.message}</p>;
  }

  const pendingCount = pendingRequests?.length || 0;
  const totalPendingAmount =
    pendingRequests
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

  if (approvedError) {
    return <p className="p-6 text-red-600">Error loading approved requests: {approvedError.message}</p>;
  }

  const totalApprovedAmount =
    approvedRequests
      ?.map((r) => parseFloat(r.amount))
      .filter((amt) => !isNaN(amt))
      .reduce((sum, amt) => sum + amt, 0) ?? 0;

      const { data: pendingRequestsWithDetails, error: allRequestsError } = await supabase
      .from("reimbursement_requests")
      .select("id, amount, status, expense_date, category, user_id, users:user_id(name), description, receipt_url, approval_comments, created_at")
      .eq("approver", managerId)
      .eq("status", "Pending")
      .gte("expense_date", yearStart)
      .lte("expense_date", yearEnd)
      .order("expense_date", { ascending: false });
    
  if (allRequestsError) {
    return <p className="p-6 text-red-600">Error loading requests: {allRequestsError.message}</p>;
  }
  const { data: approvedRejectedRequests, error: approvedRejectedError } = await supabase
  .from("reimbursement_requests")
  .select("id, amount, status, expense_date, category, user_id, users:user_id(name), description, receipt_url, approval_comments, created_at")
  .eq("approver", managerId)
  .in("status", ["Approved", "Rejected"]);

  const requests = isRequestArray(pendingRequestsWithDetails) 
  ? pendingRequestsWithDetails 
  : [];

if (approvedRejectedError) {
  return <p className="p-6 text-red-600">Error loading approved/rejected requests: {approvedRejectedError.message}</p>;
}
const { data: rejectedRequests, error: rejectedError } = await supabase
  .from("reimbursement_requests")
  .select("amount")
  .eq("approver", managerId)
  .eq("status", "Rejected")
  .gte("expense_date", yearStart)
  .lte("expense_date", yearEnd);

if (rejectedError) {
  return <p className="p-6 text-red-600">Error loading rejected requests: {rejectedError.message}</p>;
}

const totalRejectedAmount =
  rejectedRequests
    ?.map((r) => parseFloat(r.amount))
    .filter((amt) => !isNaN(amt))
    .reduce((sum, amt) => sum + amt, 0) ?? 0;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Manager Approvals Dashboard</h1>
      <p className="text-gray-600 mb-8">
        Review and approve team expense requests for {currentYear}
      </p>

      <div className="flex gap-6 flex-wrap mb-8">
        <Card className="flex-1 min-w-[250px]">
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{teamCount}</p>
          </CardContent>
          <CardDescription className="px-6 pb-4 text-gray-500">
            Active employees
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
            <CardDescription>Total approved in {currentYear}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{totalApprovedAmount.toFixed(2)}</p>
          </CardContent>
          <CardDescription className="px-6 pb-4 text-gray-500">
            Approved by you
          </CardDescription>
        </Card>
<Card className="flex-1 min-w-[250px]">
  <CardHeader>
    <CardTitle>Rejected Amount</CardTitle>
    <CardDescription>Total rejected in {currentYear}</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-2xl font-bold">₹{totalRejectedAmount.toFixed(2)}</p>
  </CardContent>
  <CardDescription className="px-6 pb-4 text-gray-500">
    Rejected by you
  </CardDescription>
</Card>
      </div>

      <div className="mt-8">
      <h2 className="text-3xl font-bold mb-6">Approvals</h2>
  <Tabs defaultValue="pending" className="w-full">
    <TabsList className="w-full grid grid-cols-2 mb-4">
      <TabsTrigger value="pending" className="w-full">
        Pending
      </TabsTrigger>
      <TabsTrigger value="approvedRejected" className="w-full">
        Approved & Rejected
      </TabsTrigger>
    </TabsList>

    <TabsContent value="pending">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <div>
            <CardTitle className="text-2xl font-semibold">Pending Approvals</CardTitle>
            <CardDescription>
              Requests submitted in {currentYear}
            </CardDescription>
          </div>
          {pendingRequestsWithDetails?.length > 0 && (
            <BulkActions requestIds={pendingRequestsWithDetails.map(req => req.id)} />
          )}
        </CardHeader>
        <CardContent>
        <RequestsTable
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

    <TabsContent value="approvedRejected">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <div>
            <CardTitle className="text-2xl font-semibold">Approved and Rejected Requests</CardTitle>
            <CardDescription>
            All Approved and Rejected Requests
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
        <ApprovedRejected
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
  </Tabs>
</div>


    </div>
  );
}
