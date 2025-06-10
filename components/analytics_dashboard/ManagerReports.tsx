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
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableCaption, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { fetchUserByIdDashboard,fetchManagerReportsData } from "@/lib/dashboard/action";
import type { ChartOptions } from 'chart.js';


ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, ArcElement, Legend);

type ManagerReportsProps = {
  managerID: string;
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

export default function ManagerReports({ managerID }: ManagerReportsProps) {
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

  const [users, setUsers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { users, requests } = await fetchManagerReportsData(managerID);
        setUsers(users);
        setRequests(requests);
      } catch (error: any) {
        console.error(error.message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [managerID]);
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));
  const filteredRequests = requests.filter((r) => {
    const date = new Date(r.expense_date);
    const withinDateRange =
      date >= new Date(startDate) && date <= new Date(endDate);
    const matchesCategory = !selectedCategory || r.category === selectedCategory;
    const matchesStatus = !selectedStatus || r.status === selectedStatus;
    return withinDateRange && matchesCategory && matchesStatus;
  });

  const searchFilteredRequests = filteredRequests.filter((r) => {
    const userName = (userMap[r.user_id] || "").toLowerCase();
    const description = (r.description || "").toLowerCase();
    const amount = r.amount?.toString() || "";
    const category = (r.category || "").toLowerCase();
    const expenseDate = new Date(r.expense_date).toLocaleDateString("en-IN");
    const createdAt = new Date(r.created_at).toLocaleDateString("en-IN");
    const status = (r.status || "").toLowerCase();

    const search = searchText.toLowerCase();

    return (
      userName.includes(search) ||
      description.includes(search) ||
      amount.includes(search) ||
      category.includes(search) ||
      expenseDate.includes(search) ||
      createdAt.includes(search) ||
      status.includes(search)
    );
  });

  const teamCount = users.length;

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
  const totalAllocatedBudget = users.reduce(
    (sum, u) => sum + parseFloat(u.reimbursement_budget ?? "0"),
    0
  );

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
        label: "Total Expense Amount",
        data: expenseByCategory,
        backgroundColor: "rgba(59, 130, 246, 0.7)",
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
          weight: 'bold' as const,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };
  const totalPendingAmount = searchFilteredRequests
    .filter((r) => r.status === "Pending")
    .reduce((sum, r) => sum + parseFloat(r.amount ?? "0"), 0);
  const approvedThisMonth = searchFilteredRequests.filter((r) => {
    const date = new Date(r.expense_date);
    const now = new Date();
    return (
      r.status === "Approved" &&
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    );
  });

  const approvedThisMonthCount = approvedThisMonth.length;

  const approvedThisMonthAmount = approvedThisMonth.reduce(
    (sum, r) => sum + parseFloat(r.amount ?? "0"),
    0
  );
  const now = new Date();
  const currentYear = now.getFullYear();
  const monthlyStats: Record<string, { expense: number; reimbursements: number }> = {};

  for (let i = 0; i < 12; i++) {
    const monthKey = `${currentYear}-${(i + 1).toString().padStart(2, "0")}`;
    monthlyStats[monthKey] = { expense: 0, reimbursements: 0 };
  }

  searchFilteredRequests.forEach((r) => {
    const date = new Date(r.expense_date);
    const key = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;

    if (date.getFullYear() === currentYear) {
      monthlyStats[key].expense += parseFloat(r.amount ?? "0");

      if (r.status === "Approved") {
        monthlyStats[key].reimbursements += parseFloat(r.amount ?? "0");
      }
    }
  });

  const sortedMonths = Object.keys(monthlyStats).sort();
  const monthlyExpenseLabels = sortedMonths.map((m) =>
    new Date(m + "-01").toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    })
  );
  const monthlyExpenseData = sortedMonths.map((m) => monthlyStats[m].expense);
  const monthlyReimbursementsData = sortedMonths.map(
    (m) => monthlyStats[m].reimbursements
  );

  const monthlyExpensesChartData = {
    labels: monthlyExpenseLabels,
    datasets: [
      {
        label: "Total Expenses",
        data: monthlyExpenseData,
        backgroundColor: "#3b82f6",
      },
      {
        label: "Approved Reimbursements",
        data: monthlyReimbursementsData,
        backgroundColor: "#10b981",
      },
    ],
  };

  const currentMonth = now.getMonth();

  const currentMonthRequests = searchFilteredRequests.filter(req => {
    const expenseDate = new Date(req.expense_date);
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
  }).slice(0, 5);
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
            <CardTitle>Approved Amount</CardTitle>
            <CardDescription>Total approved reimbursements</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ₹{totalApprovedAmount.toFixed(2)}
            </p>
          </CardContent>
          <CardDescription className="px-6 pb-4 text-gray-500">
            Approved by you — {approvedRequests.length} request
            {approvedRequests.length !== 1 ? "s" : ""}
          </CardDescription>
        </Card>

        <Card className="flex-1 min-w-[250px]">
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
            <CardDescription>Reimbursements awaiting your approval</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ₹{totalPendingAmount.toFixed(2)}
            </p>
          </CardContent>
          <CardDescription className="px-6 pb-4 text-gray-500">
            Pending requests — {pendingCount} pending
          </CardDescription>
        </Card>


        <Card className="flex-1 min-w-[250px]">
          <CardHeader>
            <CardTitle>Team Budget Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ₹{totalAllocatedBudget.toFixed(2)}
            </p>
          </CardContent>
          <CardDescription className="px-6 pb-4 text-gray-500">
            Total budget assigned to your team
          </CardDescription>
        </Card>
        <Card className="flex-1 min-w-[250px]">
          <CardHeader>
            <CardTitle>Approved This Month</CardTitle>
            <CardDescription>Approvals in {new Date().toLocaleString('default', { month: 'long' })}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ₹{approvedThisMonthAmount.toFixed(2)}
            </p>
          </CardContent>
          <CardDescription className="px-6 pb-4 text-gray-500">
            {approvedThisMonthCount} reimbursement{approvedThisMonthCount !== 1 ? "s" : ""} approved
          </CardDescription>
        </Card>

      </div>
    
      <div className="flex flex-col md:flex-row gap-8 mt-6">
        <div className="flex-1 min-w-[280px] max-w-full">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Total Expense Amount by Category</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <div className="relative h-full w-full">
                <Pie
                  data={{
                    labels: categories,
                    datasets: [
                      {
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
                        hoverOffset: 6,
                      },
                    ],
                  }}
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      title: {
                        display: true,
                        text: "Total Expense by Category",
                        font: {
                          size: 16,
                          weight: "bold",
                        },
                      },
                      legend: {
                        position: "bottom" as const,
                      },
                      tooltip: {
                        callbacks: {
                          label: function (context: any) {
                            const label = context.label || "";
                            const value = context.raw || 0;

                            return `${label}: ₹${value.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`;
                          },
                        },
                      },
                    },
                  }}

                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 min-w-[280px] max-w-full">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Expenses vs Reimbursements</CardTitle>
            </CardHeader>
            <CardContent>
              <Bar
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    title: {
                      ...chartOptions.plugins.title,
                      text: "Monthly Expenses vs Approved Reimbursements",
                    },
                  },
                }}
                data={monthlyExpensesChartData}
              />
            </CardContent>
          </Card>
        </div>

      </div>
      <Card>
        <CardHeader>
        <CardTitle>Recent Expenses</CardTitle>
<CardDescription>latest expense submissions</CardDescription>

        </CardHeader>

        <CardContent>
          {currentMonthRequests.length > 0 ? (
            <div className="flex flex-col gap-4">
             {currentMonthRequests.map((req, idx) => (
  <Card key={idx} className="w-full p-4 shadow-md border rounded-md flex justify-between items-center">
    <div className="flex flex-col">
    <span className="text-lg font-semibold text-gray-800">
    {userMap[req.user_id] || "Unknown User"}
  </span>
      <span className="text-sm text-gray-800 mt-1">
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
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[req.status] ?? "bg-gray-100 text-gray-700"}`}>
        {req.status}
      </span>
    </div>
  </Card>
))}

            </div>
          ) : (
            <div className="text-center text-sm text-gray-500 mt-4">
              No reimbursement requests found for this month.
            </div>
          )}
        </CardContent>

        <div className="flex justify-center p-4 border-t">
          <Button
            onClick={() => router.push("/manager")}
            variant="outline"
          >
            View all Request
          </Button>

        </div>
      </Card>
    </div>
  );
}
