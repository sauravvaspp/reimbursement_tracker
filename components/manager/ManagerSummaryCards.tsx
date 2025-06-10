import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
  } from "@/components/ui/card";
  
  type Props = {
    teamCount: number;
    pendingCount: number;
    totalPendingAmount: number;
    totalApprovedAmount: number;
  };
  
  export default function ManagerSummaryCards({
    teamCount,
    pendingCount,
    totalPendingAmount,
    totalApprovedAmount,
  }: Props) {
    return (
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
            ₹{totalPendingAmount.toFixed(2)} pending
          </CardDescription>
        </Card>
  
        <Card className="flex-1 min-w-[250px]">
          <CardHeader>
            <CardTitle>Approved Amount</CardTitle>
            <CardDescription>Total approved reimbursements</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{totalApprovedAmount.toFixed(2)}</p>
          </CardContent>
          <CardDescription className="px-6 pb-4 text-gray-500">
            Approved by you
          </CardDescription>
        </Card>
      </div>
    );
  }
  