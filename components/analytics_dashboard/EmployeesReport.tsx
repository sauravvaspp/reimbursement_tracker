"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";


import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
} from "@/components/ui/select";


import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableCaption, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { fetchUserByIdDashboard,fetchRequestsByUserIdDashboard } from "@/lib/dashboard/action";


ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);


type EmployeeReportsProps = {
  EmployeesId: string;
};

const statusColors: Record<string, string> = {
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
  Pending: "bg-orange-100 text-orange-800",
};

const categories = [
  "Meals and Entertainment",
  "Transportation",
  "Accommodation",
  "Office Supplies",
  "Training and Development",
  "Software and Subscriptions",
  "Marketing",
  "Other",
];

const statuses = ["Approved", "Rejected", "Pending"];

export default function EmployeeReports({ EmployeesId }: EmployeeReportsProps) {
  const router = useRouter();

  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
  });

  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];
  });

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await fetchUserByIdDashboard(EmployeesId);
        const reqs = await fetchRequestsByUserIdDashboard(EmployeesId);

        setUser(userData);
        setRequests(reqs);
      } catch (error: any) {
        console.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (EmployeesId) {
      fetchData();
    }
  }, [EmployeesId]);

  const filteredRequests = requests.filter((r) => {
    const date = new Date(r.expense_date);
    const withinDateRange =
      date >= new Date(startDate) && date <= new Date(endDate);
    const matchesCategory = !selectedCategory || r.category === selectedCategory;
    const matchesStatus = !selectedStatus || r.status === selectedStatus;
    return withinDateRange && matchesCategory && matchesStatus;
  });

  const searchFilteredRequests = filteredRequests.filter((r) => {
    const description = (r.description || "").toLowerCase();
    const amount = r.amount?.toString() || "";
    const category = (r.category || "").toLowerCase();
    const expenseDate = new Date(r.expense_date).toLocaleDateString("en-IN");
    const createdAt = new Date(r.created_at).toLocaleDateString("en-IN");
    const status = (r.status || "").toLowerCase();

    const search = searchText.toLowerCase();

    return (
      description.includes(search) ||
      amount.includes(search) ||
      category.includes(search) ||
      expenseDate.includes(search) ||
      createdAt.includes(search) ||
      status.includes(search)
    );
  });

  const approvedRequests = searchFilteredRequests.filter(
    (r) => r.status === "Approved"
  );
  const totalApprovedAmount = approvedRequests.reduce(
    (sum, r) => sum + parseFloat(r.amount ?? "0"),
    0
  );
  const pendingCount = searchFilteredRequests.filter(
    (r) => r.status === "Pending"
  ).length;
  const rejectedCount = searchFilteredRequests.filter(
    (r) => r.status === "Rejected"
  ).length;
  const totalAllocatedBudget = user?.reimbursement_budget
    ? parseFloat(user.reimbursement_budget)
    : 0;

  const expenseByCategory = categories.map((cat) => {
    return searchFilteredRequests
      .filter((r) => r.category === cat)
      .reduce((sum, r) => sum + parseFloat(r.amount ?? "0"), 0);
  });

  const requestsCountByStatus = statuses.map(
    (status) =>
      searchFilteredRequests.filter((r) => r.status === status).length
  );

  const expenseByCategoryData = {
    labels: categories,
    datasets: [
      {
        label: "Expenses",
        data: expenseByCategory,
        backgroundColor: [
          "#3b82f6",
          "#10b981",
          "#f59e0b",
          "#ef4444",
          "#8b5cf6",
          "#ec4899",
          "#14b8a6",
          "#f97316",
        ],
      },
    ],
  };

  const currentYear = new Date().getFullYear();

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i;

    const monthRequests = searchFilteredRequests.filter((r) => {
      const date = new Date(r.expense_date);
      return date.getFullYear() === currentYear && date.getMonth() === month;
    });

    const totalExpenses = monthRequests.reduce(
      (sum, r) => sum + parseFloat(r.amount ?? "0"),
      0
    );

    const approvedAmount = monthRequests
      .filter((r) => r.status === "Approved")
      .reduce((sum, r) => sum + parseFloat(r.amount ?? "0"), 0);

    return {
      monthLabel: new Date(currentYear, month).toLocaleString("default", {
        month: "short",
      }),
      totalExpenses,
      approvedAmount,
    };
  });

  const monthlyExpenseVsReimbursementData = {
    labels: monthlyData.map((m) => m.monthLabel),
    datasets: [
      {
        label: "Total Expenses",
        data: monthlyData.map((m) => m.totalExpenses),
        backgroundColor: "#3b82f6", 
      },
      {
        label: "Approved Reimbursement",
        data: monthlyData.map((m) => m.approvedAmount),
        backgroundColor: "#22c55e", 
      },
    ],
  };


  const requestsCountByStatusData = {
    labels: statuses,
    datasets: [
      {
        label: "Count of Requests",
        data: requestsCountByStatus,
        backgroundColor: ["#22c55e", "#ef4444", "#f97316"],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        font: {
          size: 16,
          weight: "bold",
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };
  const recentRequests = searchFilteredRequests
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold">Dashboard</h2>
        <Button onClick={() => router.push("/expenses")}>
          Submit New Expense
        </Button>
      </div>
      <div className="flex flex-wrap gap-4">
        <Card className="flex-1 min-w-[250px]">
          <CardHeader>
            <CardTitle>Approved Amount</CardTitle>
            <CardDescription>Total approved reimbursements</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ₹{totalApprovedAmount.toFixed(2)}
            </p>
          </CardContent>
          <CardDescription className="px-6 pb-4 text-gray-500">
            Approved — {approvedRequests.length} request
            {approvedRequests.length !== 1 ? "s" : ""}
          </CardDescription>
        </Card>

        <Card className="flex-1 min-w-[250px]">
  <CardHeader>
    <CardTitle>Pending Requests</CardTitle>
    <CardDescription>Reimbursements awaiting approval</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-2xl font-bold">
      ₹
      {searchFilteredRequests
        .filter((r) => r.status === "Pending")
        .reduce((sum, r) => sum + parseFloat(r.amount ?? "0"), 0)
        .toFixed(2)}
    </p>
  </CardContent>
  <CardDescription className="px-6 pb-4 text-gray-500">
    Pending requests — {pendingCount} pending
  </CardDescription>
</Card>

        <Card className="flex-1 min-w-[250px]">
          <CardHeader>
            <CardTitle>Rejected Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{rejectedCount}</p>
          </CardContent>
          <CardDescription className="px-6 pb-4 text-gray-500">
            Requests that were rejected
          </CardDescription>
        </Card>

        <Card className="flex-1 min-w-[250px]">
          <CardHeader>
            <CardTitle>My Budget Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ₹{totalAllocatedBudget.toFixed(2)}
            </p>
          </CardContent>
          <CardDescription className="px-6 pb-4 text-gray-500">
            Total budget allocated to me
          </CardDescription>
        </Card>
        <Card className="flex-1 min-w-[250px]">
  <CardHeader>
    <CardTitle>Approved This Month</CardTitle>
    <CardDescription>
      Approvals in {new Date().toLocaleString("default", { month: "long" })}
    </CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-2xl font-bold">
      ₹
      {searchFilteredRequests
        .filter((r) => {
          const d = new Date(r.expense_date);
          return (
            r.status === "Approved" &&
            d.getMonth() === new Date().getMonth() &&
            d.getFullYear() === new Date().getFullYear()
          );
        })
        .reduce((sum, r) => sum + parseFloat(r.amount ?? "0"), 0)
        .toFixed(2)}
    </p>
  </CardContent>
  <CardDescription className="px-6 pb-4 text-gray-500">
    {
      searchFilteredRequests.filter((r) => {
        const d = new Date(r.expense_date);
        return (
          r.status === "Approved" &&
          d.getMonth() === new Date().getMonth() &&
          d.getFullYear() === new Date().getFullYear()
        );
      }).length
    }{" "}
    reimbursements approved
  </CardDescription>
</Card>
      </div>

      <div className="flex flex-col md:flex-row gap-8 mt-6">
        {/* Pie Chart */}
        <div className="flex-1 min-w-[280px] max-w-full h-[400px]">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Expense Breakdown by Category</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
              <Pie
                data={expenseByCategoryData}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: "bottom" },
                    title: {
                      display: true,
                      text: "My Expense Amount by Category",
                      font: { size: 16, weight: "bold" },
                    },
                  },
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Bar Chart */}
        <div className="flex-1 min-w-[280px] max-w-full h-[400px]">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Monthly Expenses vs Reimbursement</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
              <Bar
                data={monthlyExpenseVsReimbursementData}
                options={{
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    legend: { position: "bottom" },
                    title: {
                      display: true,
                      text: `Monthly Overview (${currentYear})`,
                      font: { size: 16, weight: "bold" },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { callback: (val) => `₹${val}` },
                    },
                  },
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>


      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
          <CardDescription>Latest 5 expense submissions</CardDescription>
        </CardHeader>

        <CardContent>
          {recentRequests.length > 0 ? (
            <div className="flex flex-col gap-4">
              {recentRequests.map((req, idx) => (
                <Card
                  key={idx}
                  className="w-full p-4 shadow-md border rounded-md flex justify-between items-center"
                >
                  <div className="flex flex-col">
                    <span className="text-lg font-semibold text-gray-800">
                      {req.category}
                    </span>
                    <span className="text-sm text-gray-500 mt-1">
                      {new Date(req.expense_date).toLocaleDateString("en-IN")}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="text-lg font-semibold text-gray-900">
                      ₹{parseFloat(req.amount).toFixed(2)}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[req.status] ?? "bg-gray-100 text-gray-700"
                        }`}
                    >
                      {req.status}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center text-sm text-gray-500 mt-4">
              No recent reimbursement requests found.
            </div>
          )}
        </CardContent>

        <div className="flex justify-center p-4 border-t">
          <Button onClick={() => router.push("/requests")} variant="outline">
            View All Requests
          </Button>
        </div>
      </Card>

    </div>
  );
}