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
import { Bar,Pie  } from "react-chartjs-2";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Table, TableCaption, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../ui/table";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { fetchUsersAndRequests } from "@/lib/dashboard/action";

ChartJS.register(CategoryScale, LinearScale, BarElement,ArcElement, Title, Tooltip, Legend);
const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

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

export default function AdminReports() {
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
        const { users, requests } = await fetchUsersAndRequests();
        setUsers(users);
        setRequests(requests);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);

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

  const totalEmployees = users.length;
  const totalRequests = searchFilteredRequests.length;

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
  const totalBudgetAllocated = users.reduce(
    (sum, u) => sum + parseFloat(u.reimbursement_budget ?? "0"),
    0
  );

  const expenseByCategory = categories.map((cat) => {
    return searchFilteredRequests
      .filter((r) => r.category === cat && r.status === "Approved") // Add status filter
      .reduce((sum, r) => sum + parseFloat(r.amount ?? "0"), 0);
  });
  
  const requestsCountByStatus = statuses.map(
    (status) =>
      searchFilteredRequests.filter((r) => r.status === status).length
  );

  const topEmployeesByApproved = [...users]
  .map((user) => {
    const approvedForUser = searchFilteredRequests.filter(
      (r) => r.user_id === user.id && r.status === "Approved"
    );
    return {
      name: user.name,
      count: approvedForUser.length,
      totalAmount: approvedForUser.reduce((sum, r) => sum + parseFloat(r.amount ?? "0"), 0),
    };
  })
  .sort((a, b) => b.count - a.count);



  const expenseByCategoryData = {
    labels: categories,
    datasets: [
      {
        label: "Total Approved Expense Amount",
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

  const topEmployeesData = {
    labels: topEmployeesByApproved.map((e) => e.name),
    datasets: [
      {
        label: "Approved Request Count",
        data: topEmployeesByApproved.map((e) => e.count),
        backgroundColor: "rgba(139, 92, 246, 0.7)",
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
        text: "Monthly Expenses vs Reimbursements",
      },
    },
    scales: {
      x: {
        beginAtZero: true,
      },
      y: {
        beginAtZero: true,
      },
    },
  };
  
const expenses = new Array(12).fill(0);
const reimbursements = new Array(12).fill(0);
searchFilteredRequests.forEach((r) => {
  const monthIndex = new Date(r.expense_date).getMonth();
  if (r.status === "Approved") {
    reimbursements[monthIndex] += parseFloat(r.amount ?? "0");
  }
  expenses[monthIndex] += parseFloat(r.amount ?? "0");
});

const monthlyData = {
  labels: months,
  datasets: [
    {
      label: "Expenses (All Requests)",
      data: expenses,
      backgroundColor: "rgba(255, 99, 132, 0.2)",
      borderColor: "rgba(255, 99, 132, 1)",
      borderWidth: 1,
    },
    {
      label: "Approved Reimbursements",
      data: reimbursements,
      backgroundColor: "rgba(54, 162, 235, 0.2)",
      borderColor: "rgba(54, 162, 235, 1)",
      borderWidth: 1,
    },
  ],
};
  const expenseByCategoryPieData = {
    labels: categories,
    datasets: [
      {
        label: "Approved Expenses by Category",
        data: expenseByCategory,
        backgroundColor: [
          "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#ec4899", "#14b8a6", "#8b5cf6"
        ],
        borderWidth: 1,
      },
    ],
  };
  const currentMonthRequests = searchFilteredRequests.filter((req) => {
    const now = new Date();
    return new Date(req.expense_date).getMonth() === now.getMonth() &&
           new Date(req.expense_date).getFullYear() === now.getFullYear();
  });
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-2">Dashboard</h2>

      <div className="flex flex-wrap gap-4">
        <Card className="flex-1 min-w-[250px]">
          <CardHeader>
            <CardTitle>Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalEmployees}</p>
          </CardContent>
          <CardDescription className="px-6 pb-4 text-gray-500">
            Employees in the system
          </CardDescription>
        </Card>

        <Card className="flex-1 min-w-[250px]">
          <CardHeader>
            <CardTitle>Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalRequests}</p>
          </CardContent>
          <CardDescription className="px-6 pb-4 text-gray-500">
            All reimbursement requests
          </CardDescription>
        </Card>

        <Card className="flex-1 min-w-[250px]">
          <CardHeader>
            <CardTitle>Approved Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ₹{totalApprovedAmount.toFixed(2)}
            </p>
          </CardContent>
          <CardDescription className="px-6 pb-4 text-gray-500">
            Total approved reimbursements
          </CardDescription>
        </Card>

        <Card className="flex-1 min-w-[250px]">
          <CardHeader>
            <CardTitle>Total Budget Allocated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ₹{totalBudgetAllocated.toFixed(2)}
            </p>
          </CardContent>
          <CardDescription className="px-6 pb-4 text-gray-500">
            Combined budget for all employees
          </CardDescription>
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Approved Amount by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <Bar
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      title: {
  ...chartOptions.plugins.title,
  text: "Approved Expense Amount by Category",
},
                    },
                  }}
                  data={expenseByCategoryData}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Expenses vs Reimbursement</CardTitle>
              </CardHeader>
              <CardContent>
              <Bar data={monthlyData} options={chartOptions} />
              </CardContent>
            </Card>

          
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
  <Card className="min-h-[400px]">
    <CardHeader>
      <CardTitle>Employees by Approved Request Count</CardTitle>
    </CardHeader>
    <CardContent className="h-full">
      <Bar
        options={{
          ...chartOptions,
          plugins: {
            ...chartOptions.plugins,
            title: {
              ...chartOptions.plugins.title,
              text: "Employees by Approved Request Count",
            },
            tooltip: {
              callbacks: {
                label: function (context: any) {
                  const approvedAmount =
                    topEmployeesByApproved[context.dataIndex]?.totalAmount ?? 0;
                  const count = context.raw;
                  return [
                    `Approved Requests: ${count}`,
                    `Approved Amount: ₹${approvedAmount.toFixed(2)}`,
                  ];
                },
              },
            },
          },
        }}
        data={topEmployeesData}
      />
    </CardContent>
  </Card>

  <Card className="min-h-[400px]">
  <CardHeader>
    <CardTitle>Approved by Category</CardTitle>
  </CardHeader>
  <CardContent className="h-full">
    <div className="relative h-[300px]">
      <Pie
        data={expenseByCategoryPieData}
        options={{
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "right" as const,
            },
            title: {
              display: true,
              text: "Expenses by Category",
            },
          },
        }}
      />
    </div>
  </CardContent>
</Card>

</div>

<Card>
  <CardHeader>
    <CardTitle>Recent Expenses</CardTitle>
    <CardDescription>Latest expense submissions</CardDescription>
  </CardHeader>

  <CardContent>
  {currentMonthRequests.length > 0 ? (
    <div className="flex flex-col gap-4">
      {currentMonthRequests.slice(0, 5).map((req, idx) => (
        <Card
          key={idx}
          className="w-full p-4 shadow-md border rounded-md flex justify-between items-center"
        >
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-gray-800">
              {userMap[req.user_id] || "Unknown User"}
            </span>
            <span className="text-sm text-gray-800 mt-1">{req.category}</span>
            <span className="text-sm text-gray-500 mt-1">
              {new Date(req.expense_date).toLocaleDateString("en-IN")}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-lg font-semibold text-gray-900">
              ₹{parseFloat(req.amount).toFixed(2)}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                statusColors[req.status] ?? "bg-gray-100 text-gray-700"
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
      No reimbursement requests found for this month.
    </div>
  )}
</CardContent>


  <div className="flex justify-center p-4 border-t">
    <Button onClick={() => router.push("/all_request")} variant="outline">
      View all Requests
    </Button>
  </div>
</Card>

    </div>
  );
}