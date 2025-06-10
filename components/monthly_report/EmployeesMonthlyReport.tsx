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
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { fetchUserById,fetchReimbursementRequestsByUserId } from "@/lib/dashboard/action";
import { Button } from "../ui/button";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { utils, writeFile } from "xlsx";
import { TooltipItem } from "chart.js";
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

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

const months = [
  { value: "0", label: "All Months" },
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const days = Array.from({ length: 31 }, (_, i) => ({
  value: (i + 1).toString(),
  label: (i + 1).toString(),
}));
days.unshift({ value: "0", label: "All Days" });

export default function EmployeesMonthlyReport({ EmployeesId }: EmployeeReportsProps) {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  
  const [selectedDay, setSelectedDay] = useState("0");
  const [selectedMonth, setSelectedMonth] = useState("0");
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await fetchUserById(EmployeesId);
        const reqs = await fetchReimbursementRequestsByUserId(EmployeesId);

        setUser(userData);
        setRequests(reqs);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    if (EmployeesId) {
      fetchData();
    }
  }, [EmployeesId]);

  const filteredRequests = requests.filter((r) => {
    const expenseDate = new Date(r.expense_date);
    const expenseYear = expenseDate.getFullYear().toString();
    const expenseMonth = (expenseDate.getMonth() + 1).toString();
    const expenseDay = expenseDate.getDate().toString();

    const effectiveYear = selectedYear !== "0" ? selectedYear : new Date().getFullYear().toString();
    const effectiveMonth = selectedMonth !== "0" ? selectedMonth : (selectedDay !== "0" ? (new Date().getMonth() + 1).toString() : "0");
    
    if (selectedYear !== "0" && expenseYear !== selectedYear) {
      return false;
    }
    
    if (selectedMonth !== "0" && expenseMonth !== selectedMonth) {
      return false;
    } else if (selectedDay !== "0" && selectedMonth === "0" && expenseMonth !== effectiveMonth) {
      return false;
    }
    
    if (selectedDay !== "0" && expenseDay !== selectedDay) {
      return false;
    }
    
    const matchesCategory = !selectedCategory || r.category === selectedCategory;
    const matchesStatus = !selectedStatus || r.status === selectedStatus;
    
    return matchesCategory && matchesStatus;
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

  const years = Array.from({ length: 6 }, (_, i) => ({
    value: (currentYear - i).toString(),
    label: (currentYear - i).toString(),
  }));
  years.unshift({ value: "0", label: "All Years" });

  const getDateFilterDescription = () => {
    if (selectedYear === "0" && selectedMonth === "0" && selectedDay === "0") return "All Time";
    
    let description = "";
    
    if (selectedYear !== "0") {
      description += selectedYear;
    } else if (selectedMonth !== "0" || selectedDay !== "0") {
      description += new Date().getFullYear().toString();
    }
    
    if (selectedMonth !== "0") {
      if (description) description += " ";
      description += months.find(m => m.value === selectedMonth)?.label;
    } else if (selectedDay !== "0") {
      if (description) description += " ";
      description += months.find(m => m.value === (new Date().getMonth() + 1).toString())?.label;
    }
    
    if (selectedDay !== "0") {
      if (description) description += ", ";
      description += selectedDay;
    }
    
    return description || "All Time";
  };
  
// Get ISO week string (e.g., "2025-W23")
const getWeekYear = (dateStr: string) => {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const oneJan = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((+d - +oneJan) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + oneJan.getDay() + 1) / 7);
  return `${year}-W${week.toString().padStart(2, '0')}`;
};
// Get all week keys in sorted order
const weeksInData = Array.from(
  new Set(searchFilteredRequests.map((r) => getWeekYear(r.expense_date)))
).sort();

// Initialize counts for each status per week
const weeklyStatusCounts: Record<string, number[]> = {
  Approved: [],
  Rejected: [],
  Pending: [],
};

weeksInData.forEach((week) => {
  ["Approved", "Rejected", "Pending"].forEach((status) => {
    const count = searchFilteredRequests.filter(
      (r) => getWeekYear(r.expense_date) === week && r.status === status
    ).length;
    weeklyStatusCounts[status].push(count);
  });
});
const lineChartData = {
  labels: weeksInData,
  datasets: [
    {
      label: "Approved",
      data: weeklyStatusCounts.Approved,
      borderColor: "#22c55e",
      backgroundColor: "rgba(34, 197, 94, 0.2)",
      fill: true,
      tension: 0.4, // smoother curve
    },
    {
      label: "Rejected",
      data: weeklyStatusCounts.Rejected,
      borderColor: "#ef4444",
      backgroundColor: "rgba(239, 68, 68, 0.2)",
      fill: true,
      tension: 0.4,
    },
    {
      label: "Pending",
      data: weeklyStatusCounts.Pending,
      borderColor: "#f97316",
      backgroundColor: "rgba(249, 115, 22, 0.2)",
      fill: true,
      tension: 0.4,
    },
  ],
};
const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom" as const,
      labels: {
        usePointStyle: true,
        pointStyle: "circle",
      },
    },
    title: {
      display: false,
    },
    tooltip: {
      mode: "index" as const,
      intersect: false,
      callbacks: {
        label: (context: TooltipItem<'line'>) => {
          const value = context.parsed.y || 0;
          return `${context.dataset.label}: ${value}`;
        },
      },
    },
  },
  interaction: {
    mode: "index" as const,
    intersect: false,
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1,
        precision: 0,
      },
      title: {
        display: true,
        text: "Requests",
      },
    },
    x: {
      title: {
        display: true,
        text: "Week",
      },
    },
  },
};

// Get all 12 months
const monthlyLabels = Array.from({ length: 12 }, (_, i) =>
  new Date(0, i).toLocaleString("default", { month: "short" })
);

// Get total expense per month
const monthlyTotals = Array(12).fill(0);
searchFilteredRequests.forEach((r) => {
  const d = new Date(r.expense_date);
  const monthIndex = d.getMonth();
  monthlyTotals[monthIndex] += parseFloat(r.amount ?? "0");
});

const monthlyExpenseData = {
  labels: monthlyLabels,
  datasets: [
    {
      label: "Total Expense ( )",
      data: monthlyTotals,
      backgroundColor: "rgba(59, 130, 246, 0.7)", // blue
      borderRadius: 4,
    },
  ],
};
const pieColors = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // yellow
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
];
const exportToPDF = () => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.setTextColor(59, 130, 246);
  doc.text(`My Reimbursement Report`, 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Report Period: ${getDateFilterDescription()}`, 105, 30, { align: 'center' });
  doc.text(`Employee: ${user?.name || 'Unknown'}`, 105, 36, { align: 'center' });
  
  // Add filters info
  doc.text(`Filters: ${selectedCategory || 'All Categories'} | ${selectedStatus || 'All Statuses'}`, 14, 46);
  
  // Add horizontal line
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 51, 200, 51);
  
  // Add Key Metrics section
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Key Metrics', 14, 61);
  
  // Calculate metrics
  const totalExpenses = searchFilteredRequests.reduce((sum, r) => sum + parseFloat(r.amount ?? "0"), 0);
  const approvalRate = searchFilteredRequests.length > 0 
    ? (approvedRequests.length / searchFilteredRequests.length * 100).toFixed(1) 
    : "0";
  
  const metricsData = [
    ['Total Requests', searchFilteredRequests.length],
    ['Total Expenses', ` ${totalExpenses.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`],
    ['Approved Amount', ` ${totalApprovedAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`],
    ['Approval Rate', `${approvalRate}%`],
    ['Pending Requests', pendingCount],
    ['Rejected Requests', rejectedCount],
    ['Budget Allocation', ` ${totalAllocatedBudget.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`]
  ];
  
  autoTable(doc, {
    startY: 66,
    head: [['Metric', 'Value']],
    body: metricsData,
    theme: 'grid',
    headStyles: { 
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: { fontSize: 12 }
  });
  
  // Add Expense Categories section
  doc.setFontSize(14);
  doc.text('Expense Categories', 14, doc.lastAutoTable.finalY + 15);
  
  // Calculate category totals and percentages
  const categoryTotals = categories.map(cat => {
    const total = searchFilteredRequests
      .filter(r => r.category === cat)
      .reduce((sum, r) => sum + parseFloat(r.amount ?? "0"), 0);
    return {
      category: cat,
      total,
      percentage: totalExpenses > 0 ? (total / totalExpenses * 100).toFixed(1) : '0'
    };
  });
  
  const categoryData = categoryTotals
    .filter(item => item.total > 0)
    .map(item => [
      item.category,
      ` ${item.total.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
      `${item.percentage}%`
    ]);
  
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 20,
    head: [['Category', 'Amount', 'Percentage']],
    body: categoryData,
    theme: 'grid',
    headStyles: { 
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: { fontSize: 12 }
  });
  
  // Add Monthly Expense Data section
  doc.setFontSize(14);
  doc.text('Monthly Expense Data', 14, doc.lastAutoTable.finalY + 15);
  
  // Calculate monthly data
  const monthlyData = months.slice(1).map(month => {
    const monthRequests = searchFilteredRequests.filter(r => {
      const expenseDate = new Date(r.expense_date);
      return (expenseDate.getMonth() + 1).toString() === month.value;
    });
    
    const total = monthRequests.reduce((sum, r) => sum + parseFloat(r.amount ?? "0"), 0);
    const approved = monthRequests
      .filter(r => r.status === "Approved")
      .reduce((sum, r) => sum + parseFloat(r.amount ?? "0"), 0);
    const pending = monthRequests
      .filter(r => r.status === "Pending")
      .reduce((sum, r) => sum + parseFloat(r.amount ?? "0"), 0);
    const rejected = monthRequests
      .filter(r => r.status === "Rejected")
      .reduce((sum, r) => sum + parseFloat(r.amount ?? "0"), 0);
    
    return {
      month: month.label,
      total,
      approved,
      pending,
      rejected
    };
  });
  
  const monthlyTableData = monthlyData.map(item => [
    item.month,
    ` ${item.total.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
    ` ${item.approved.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
    ` ${item.pending.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
    ` ${item.rejected.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
  ]);
  
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 20,
    head: [['Month', 'Total', 'Approved', 'Pending', 'Rejected']],
    body: monthlyTableData,
    theme: 'grid',
    headStyles: { 
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: { fontSize: 12 }
  });
  
  // Add All Requests Data section
  doc.addPage();
  doc.setFontSize(14);
  doc.text('All My Reimbursement Requests', 14, 20);
  
  const allRequestsData = searchFilteredRequests.map(request => {
    return [
      request.description || '-',
      request.category || '-',
      ` ${parseFloat(request.amount ?? "0").toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
      new Date(request.expense_date).toLocaleDateString(),
      request.status,
      new Date(request.created_at).toLocaleDateString(),
      request.notes || '-'
    ];
  });
  
  autoTable(doc, {
    startY: 30,
    head: [['Description', 'Category', 'Amount', 'Expense Date', 'Status', 'Submitted On', 'Notes']],
    body: allRequestsData,
    theme: 'grid',
    headStyles: { 
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: { fontSize: 10 },
    margin: { horizontal: 7 }
  });
  
  // Add footer
  const pageCount = doc.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 295, { align: 'center' });
  }
  
  doc.save(`my-reimbursement-report-${new Date().toISOString().slice(0, 10)}.pdf`);
};

const exportToExcel = () => {
  // Prepare all requests data
  const allRequestsData = searchFilteredRequests.map(request => {
    return {
      'Description': request.description || '',
      'Category': request.category || '',
      'Amount': parseFloat(request.amount ?? "0"),
      'Expense Date': new Date(request.expense_date).toLocaleDateString(),
      'Status': request.status,
      'Submitted On': new Date(request.created_at).toLocaleDateString(),
      'Processed On': request.processed_at ? new Date(request.processed_at).toLocaleDateString() : '',
      'Notes': request.notes || ''
    };
  });
  
  // Prepare summary metrics
  const totalExpenses = searchFilteredRequests.reduce((sum, r) => sum + parseFloat(r.amount ?? "0"), 0);
  const approvalRate = searchFilteredRequests.length > 0 
    ? (approvedRequests.length / searchFilteredRequests.length * 100).toFixed(1) 
    : "0";

  const summaryData = [
    { 'Metric': 'Total Requests', 'Value': searchFilteredRequests.length },
    { 'Metric': 'Approved Requests', 'Value': approvedRequests.length },
    { 'Metric': 'Pending Requests', 'Value': pendingCount },
    { 'Metric': 'Rejected Requests', 'Value': rejectedCount },
    { 'Metric': 'Total Expenses', 'Value': totalExpenses },
    { 'Metric': 'Approved Amount', 'Value': totalApprovedAmount },
    { 'Metric': 'Approval Rate', 'Value': `${approvalRate}%` },
    { 'Metric': 'Budget Allocation', 'Value': totalAllocatedBudget }
  ];

  // Prepare category breakdown
  const categoryData = categories.map(cat => {
    const total = searchFilteredRequests
      .filter(r => r.category === cat)
      .reduce((sum, r) => sum + parseFloat(r.amount ?? "0"), 0);
    return {
      'Category': cat,
      'Total Amount': total,
      'Percentage': totalExpenses > 0 ? (total / totalExpenses * 100).toFixed(1) + '%' : '0%'
    };
  });

  // Create workbook
  const wb = utils.book_new();
  
  // Add sheets
  utils.book_append_sheet(wb, utils.json_to_sheet(allRequestsData), 'All Requests');
  utils.book_append_sheet(wb, utils.json_to_sheet(summaryData), 'Summary Metrics');
  utils.book_append_sheet(wb, utils.json_to_sheet(categoryData), 'Category Breakdown');
  
  // Format amounts with ₹ symbol
  const formatCurrency = (sheet: any) => {
    const range = utils.decode_range(sheet['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const header = sheet[utils.encode_cell({c: C, r: 0})];
      if (header && (header.v.includes('Amount') || header.v === 'Budget')) {
        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
          const cell = sheet[utils.encode_cell({c: C, r: R})];
          if (cell) {
            cell.v = `₹${parseFloat(cell.v).toFixed(2)}`;
            cell.t = 's';
          }
        }
      }
    }
  };

  // Apply formatting to each sheet
  wb.SheetNames.forEach(name => {
    const sheet = wb.Sheets[name];
    formatCurrency(sheet);
  });

  // Export the workbook
  writeFile(wb, `my-reimbursement-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
};
  return (
    <div className="space-y-6">
    <div className="flex justify-between items-center mb-6">
  <div>
    <h2 className="text-xl font-semibold mb-2">My Monthly Reports</h2>
    <p className="text-sm text-gray-600">
      Detailed insights into your reimbursement requests
    </p>
  </div>
  
  <div className="flex items-center gap-2">
    <Button onClick={exportToPDF} variant="outline">
      Export PDF
    </Button>
    <Button onClick={exportToExcel} variant="outline">
      Export Excel
    </Button>
  </div>
</div>
      <Card className="p-4">
  <div className="flex flex-wrap md:flex-nowrap justify-between gap-4">
    {/* Left: Year, Month, Day */}
    <div className="flex flex-wrap gap-4">
      <div className="flex flex-col">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Year
        </label>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Year</SelectLabel>
              {years.map((year) => (
                <SelectItem key={year.value} value={year.value}>
                  {year.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Month
        </label>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Month</SelectLabel>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Day
        </label>
        <Select value={selectedDay} onValueChange={setSelectedDay}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Select day" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Day</SelectLabel>
              {days.map((day) => (
                <SelectItem key={day.value} value={day.value}>
                  {day.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>

    {/* Right: Category, Status */}
    <div className="flex flex-wrap gap-4">
      <div className="flex flex-col">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <Select
          value={selectedCategory ?? ""}
          onValueChange={(value) =>
            setSelectedCategory(value === "" ? null : value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Category</SelectLabel>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <Select
          value={selectedStatus ?? ""}
          onValueChange={(value) =>
            setSelectedStatus(value === "" ? null : value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Status</SelectLabel>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>
</Card>

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
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingCount}</p>
          </CardContent>
          <CardDescription className="px-6 pb-4 text-gray-500">
            Requests pending approval
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
      </div>
      <div className="flex flex-wrap gap-4">
  {/* Pie Chart Card */}
  <Card className="flex-1 h-[360px]">
  <CardHeader className="pb-2">
    <CardTitle className="text-base">Expense by Category</CardTitle>
    <CardDescription className="text-sm">
      Distribution of expenses by category
    </CardDescription>
  </CardHeader>
  <CardContent className="h-[280px] pt-0">
    <Pie
      data={{
        ...expenseByCategoryData,
        datasets: [
          {
            ...expenseByCategoryData.datasets[0],
            backgroundColor: pieColors,
            borderColor: "#ffffff", // remove blocky border look
            borderWidth: 2,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false, // allow container sizing
        layout: {
          padding: {
            top: 10,
            bottom: 10,
            left: 10,
            right: 10,
          },
        },
        plugins: {
          legend: {
            position: "top", // move legend to top
            align: "start",
            labels: {
              boxWidth: 14,
              padding: 10,
              font: {
                size: 12,
              },
              usePointStyle: true,
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || '';
                const value = Number(context.parsed) || 0;
                return `${label}: ₹${value.toLocaleString("en-IN")}`;
              },
            },
          },
          title: { display: false },
        },
      }}
    />
  </CardContent>
</Card>


  <Card className="flex-1 h-[360px]">
    <CardHeader className="pb-2">
      <CardTitle className="text-base">Monthly Approved Rejected & Pending Amount</CardTitle>
      <CardDescription className="text-sm">
        Month-wise total expenses for the selected year
      </CardDescription>
    </CardHeader>
    <CardContent className="h-[280px] pt-0">
      <Bar
        data={monthlyExpenseData}
        options={{
          ...chartOptions,
          maintainAspectRatio: false,
          plugins: {
            ...chartOptions.plugins,
            title: { display: false },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const value = Number(context.raw) || 0;
                  return `₹${value.toLocaleString("en-IN")}`;
                },
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => `₹${value.toLocaleString('en-IN')}`,
              },
            },
          },
        }}
      />
    </CardContent>
  </Card>
</div>
      
<Card className="flex-1 h-[340px]">
  <CardHeader className="pb-2">
    <CardTitle className="text-base">Weekly Expense Trends</CardTitle>
    <CardDescription className="text-sm">
      Weekly request counts by status
    </CardDescription>
  </CardHeader>
  <CardContent className="h-[280px] pt-0">
    {weeksInData.length > 0 ? (
      <Line data={lineChartData} options={lineChartOptions} />
    ) : (
      <p className="text-gray-500">No data available for the selected filters.</p>
    )}
  </CardContent>
</Card>
<Card>
  <CardHeader>
    <CardTitle>Reimbursement Summary by Status</CardTitle>
    <CardDescription>
      Filtered Requests for {getDateFilterDescription()}
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="flex flex-col gap-4">
      {["Approved", "Rejected", "Pending"].map((status) => {
        const statusRequests = searchFilteredRequests.filter(
          (r) => r.status === status
        );

        const totalAmount = statusRequests.reduce(
          (sum, r) => sum + parseFloat(r.amount ?? "0"),
          0
        );

        return (
          <Card
            key={status}
            className="w-full p-4 shadow-sm border rounded-lg flex flex-col gap-3"
          >
            <div className="flex justify-between items-center">
              <div className="text-lg font-semibold text-gray-800">
                {status} Requests
              </div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  statusColors[status] ?? "bg-gray-100 text-gray-700"
                }`}
              >
                {status}
              </span>
            </div>

            <div className="flex justify-between text-sm text-gray-700">
              <div>
                <span className="font-medium">Count:</span> {statusRequests.length}
              </div>
              <div>
                <span className="font-medium">Total Amount:</span> ₹{totalAmount.toFixed(2)}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  </CardContent>
</Card>
    </div>
  );
}