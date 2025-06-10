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
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

import { Bar, Line } from "react-chartjs-2";
import { Pie } from "react-chartjs-2";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { fetchUsersForAdmin, fetchReimbursementRequestsForAdmin } from "@/lib/dashboard/action";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { utils, writeFile } from "xlsx";
import { Button } from "../ui/button";
import 'jspdf-autotable';
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}


ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);


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

export default function AdminMonthlyReport() {
  
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  const [selectedDay, setSelectedDay] = useState("0");
  const [selectedMonth, setSelectedMonth] = useState("0");
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, requestsData] = await Promise.all([
          fetchUsersForAdmin(),
          fetchReimbursementRequestsForAdmin(),
        ]);

        setUsers(usersData);
        setRequests(requestsData);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name]));

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
      .filter((r) => r.category === cat)
      .reduce((sum, r) => sum + parseFloat(r.amount ?? "0"), 0);
  });

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
  const monthlyExpenseAmounts = months.slice(1).map(({ value }) => {
    return searchFilteredRequests
      .filter((r) => {
        const expenseDate = new Date(r.expense_date);
        const expenseMonth = (expenseDate.getMonth() + 1).toString();
        const expenseYear = expenseDate.getFullYear().toString();

        if (selectedYear !== "0" && expenseYear !== selectedYear) return false;
        return expenseMonth === value;
      })
      .reduce((sum, r) => sum + parseFloat(r.amount ?? "0"), 0);
  });

  const monthlyExpenseData = {
    labels: months.slice(1).map((m) => m.label),
    datasets: [
      {
        label: "Month-wise total amount",
        data: monthlyExpenseAmounts,
        borderColor: "rgba(59, 130, 246, 1)",
        backgroundColor: "rgba(59, 130, 246, 0.3)",
        fill: true,
        tension: 0.4,
      },
    ],
  };
  const getWeeklyStatusData = (status: string) => {
    const weeks = [0, 0, 0, 0];

    searchFilteredRequests.forEach((req) => {
      if (req.status !== status) return;

      const date = new Date(req.expense_date);
      const day = date.getDate();

      const weekIndex = day <= 7 ? 0 : day <= 14 ? 1 : day <= 21 ? 2 : 3;
      weeks[weekIndex] += parseFloat(req.amount ?? "0");
    });

    return weeks;
  };

  const approvedData = getWeeklyStatusData("Approved");
  const rejectedData = getWeeklyStatusData("Rejected");
  const pendingData = getWeeklyStatusData("Pending");

  const weeklyExpenseData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: "Approved",
        data: approvedData,
        borderColor: "#22c55e",
        backgroundColor: "#22c55e",
        tension: 0.4,
      },
      {
        label: "Rejected",
        data: rejectedData,
        borderColor: "#ef4444",
        backgroundColor: "#ef4444",
        tension: 0.4,
      },
      {
        label: "Pending",
        data: pendingData,
        borderColor: "#f59e0b",
        backgroundColor: "#f59e0b",
        tension: 0.4,
      },
    ],
  };

  const pieColors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
    "#f97316",
  ];

  const expenseByCategoryData = {
    labels: categories,
    datasets: [
      {
        label: "Total Expense Amount",
        data: expenseByCategory,
        backgroundColor: pieColors,
        borderColor: "#fff",
        borderWidth: 1,
      },
    ],
  };
  
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.setTextColor(59, 130, 246);
    doc.text(`Reimbursements Report`, 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Report Period: ${getDateFilterDescription()}`, 105, 30, { align: 'center' });
    
    // Add filters info
    doc.text(`Filters: ${selectedCategory || 'All Categories'} | ${selectedStatus || 'All Statuses'}`, 14, 40);
    
    // Add horizontal line
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 45, 200, 45);
    
    // Add Key Metrics section
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Key Metrics', 14, 55);
    
    // Calculate metrics
    const totalExpenses = searchFilteredRequests.reduce((sum, r) => sum + parseFloat(r.amount ?? "0"), 0);
    const approvedCount = searchFilteredRequests.filter(r => r.status === "Approved").length;
    const rejectedCount = searchFilteredRequests.filter(r => r.status === "Rejected").length;
    const pendingCount = searchFilteredRequests.filter(r => r.status === "Pending").length;
    
    const approvalRate = searchFilteredRequests.length > 0 
      ? (approvedCount / searchFilteredRequests.length * 100).toFixed(1) 
      : "0";
    
    const rejectionRate = searchFilteredRequests.length > 0 
      ? (rejectedCount / searchFilteredRequests.length * 100).toFixed(1) 
      : "0";
    
    const metricsData = [
      ['Total Employees', totalEmployees],
      ['Total Requests', totalRequests],
      ['Total Expenses', ` ${totalExpenses.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`],
      ['Approved Amount', ` ${totalApprovedAmount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`],
      ['Approval Rate', `${approvalRate}%`],
      ['Rejection Rate', `${rejectionRate}%`],
      ['Pending Requests', pendingCount],
      ['Total Budget Allocated', ` ${totalBudgetAllocated.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`]
    ];
    
    autoTable(doc, {
      startY: 60,
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
    
    // Calculate monthly data - using ALL data, not just filtered
    const monthlyData = months.slice(1).map(month => {
      const monthRequests = requests.filter(r => {
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
    doc.text('All Reimbursement Requests', 14, 20);
    
    const allRequestsData = searchFilteredRequests.map(request => {
      const user = users.find(u => u.id === request.user_id);
      return [
        user?.name || 'Unknown',
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
      head: [['Employee', 'Description', 'Category', 'Amount', 'Expense Date', 'Status', 'Submitted On', 'Notes']],
      body: allRequestsData,
      theme: 'grid',
      headStyles: { 
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: { fontSize: 10 },
      margin: { horizontal: 7 },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 'auto' },
        5: { cellWidth: 'auto' },
        6: { cellWidth: 'auto' },
        7: { cellWidth: 'auto' }
      }
    });
    
    // Add Employee Summary section
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Employee Summary', 14, 20);
    
    const employeeSummaryData = users.map(user => {
      const userRequests = searchFilteredRequests.filter(r => r.user_id === user.id);
      const total = userRequests.reduce((sum, r) => sum + parseFloat(r.amount ?? "0"), 0);
      const approved = userRequests
        .filter(r => r.status === "Approved")
        .reduce((sum, r) => sum + parseFloat(r.amount ?? "0"), 0);
      const pending = userRequests
        .filter(r => r.status === "Pending")
        .reduce((sum, r) => sum + parseFloat(r.amount ?? "0"), 0);
      const rejected = userRequests
        .filter(r => r.status === "Rejected")
        .reduce((sum, r) => sum + parseFloat(r.amount ?? "0"), 0);
      
      return [
        user.name,
        user.email,
        ` ${user.reimbursement_budget?.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}`,
        userRequests.length,
        ` ${total.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
        ` ${approved.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
        ` ${pending.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
        ` ${rejected.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
      ];
    });
    
    autoTable(doc, {
      startY: 30,
      head: [['Name', 'Email', 'Budget', 'Requests', 'Total', 'Approved', 'Pending', 'Rejected']],
      body: employeeSummaryData,
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
    
    doc.save(`admin-reimbursement-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };
  
  const exportToExcel = () => {
    // Prepare all requests data
    const allRequestsData = searchFilteredRequests.map(request => {
      const user = users.find(u => u.id === request.user_id);
      return {
        'Employee Name': user?.name || 'Unknown',
        'Employee Email': user?.email || '',
        'Description': request.description || '',
        'Category': request.category || '',
        'Amount': parseFloat(request.amount ?? "0"),
        'Expense Date': new Date(request.expense_date).toLocaleDateString(),
        'Status': request.status,
        'Submitted On': new Date(request.created_at).toLocaleDateString(),
        'Approved/Rejected By': request.processed_by || '',
        'Processed On': request.processed_at ? new Date(request.processed_at).toLocaleDateString() : '',
        'Notes': request.notes || ''
      };
    });
    
    // Prepare employee summary data
    const employeeSummaryData = users.map(user => {
      const userRequests = searchFilteredRequests.filter(r => r.user_id === user.id);
      const total = userRequests.reduce((sum, r) => sum + parseFloat(r.amount ?? "0"), 0);
      const approved = userRequests
        .filter(r => r.status === "Approved")
        .reduce((sum, r) => sum + parseFloat(r.amount ?? "0"), 0);
      const pending = userRequests
        .filter(r => r.status === "Pending")
        .reduce((sum, r) => sum + parseFloat(r.amount ?? "0"), 0);
      const rejected = userRequests
        .filter(r => r.status === "Rejected")
        .reduce((sum, r) => sum + parseFloat(r.amount ?? "0"), 0);
      
      return {
        'Name': user.name,
        'Email': user.email,
        'Department': user.department || '',
        'Designation': user.designation || '',
        'Budget': user.reimbursement_budget || 0,
        'Total Requests': userRequests.length,
        'Total Amount': total,
        'Approved Amount': approved,
        'Pending Amount': pending,
        'Rejected Amount': rejected
      };
    });
  
    // Prepare summary metrics
    const summaryData = [
      { 'Metric': 'Total Employees', 'Value': totalEmployees },
      { 'Metric': 'Total Requests', 'Value': searchFilteredRequests.length },
      { 'Metric': 'Approved Requests', 'Value': searchFilteredRequests.filter(r => r.status === "Approved").length },
      { 'Metric': 'Pending Requests', 'Value': searchFilteredRequests.filter(r => r.status === "Pending").length },
      { 'Metric': 'Rejected Requests', 'Value': searchFilteredRequests.filter(r => r.status === "Rejected").length },
      { 'Metric': 'Total Expenses', 'Value': searchFilteredRequests.reduce((sum, r) => sum + parseFloat(r.amount ?? "0"), 0) },
      { 'Metric': 'Total Budget Allocated', 'Value': users.reduce((sum, u) => sum + parseFloat(u.reimbursement_budget ?? "0"), 0) }
    ];
  
    // Prepare category breakdown
    const categoryData = categories.map(cat => {
      const total = searchFilteredRequests
        .filter(r => r.category === cat)
        .reduce((sum, r) => sum + parseFloat(r.amount ?? "0"), 0);
      return {
        'Category': cat,
        'Total Amount': total,
        'Percentage': searchFilteredRequests.length > 0 ? (total / searchFilteredRequests.reduce((sum, r) => sum + parseFloat(r.amount ?? "0"), 0) * 100).toFixed(1) + '%' : '0%'
      };
    });
  
    // Create workbook
    const wb = utils.book_new();
    
    // Add sheets
    utils.book_append_sheet(wb, utils.json_to_sheet(allRequestsData), 'All Requests');
    utils.book_append_sheet(wb, utils.json_to_sheet(employeeSummaryData), 'Employee Summary');
    utils.book_append_sheet(wb, utils.json_to_sheet(summaryData), 'Summary Metrics');
    utils.book_append_sheet(wb, utils.json_to_sheet(categoryData), 'Category Breakdown');
    
    // Format amounts with   symbol
    const formatCurrency = (sheet: any) => {
      const range = utils.decode_range(sheet['!ref']);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const header = sheet[utils.encode_cell({c: C, r: 0})];
        if (header && (header.v.includes('Amount') || header.v === 'Budget')) {
          for (let R = range.s.r + 1; R <= range.e.r; ++R) {
            const cell = sheet[utils.encode_cell({c: C, r: R})];
            if (cell) {
              cell.v = ` ${parseFloat(cell.v).toFixed(2)}`;
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
    writeFile(wb, `admin-reimbursement-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };
  return (
    <div className="space-y-6">
     <div className="flex items-center justify-between w-full">
  <div>
    <h1 className="text-xl font-semibold">Reports</h1>
    <p className="text-sm text-gray-600">
      Detailed insights into company expenses and reimbursements
    </p>
  </div>
  
  <div className="flex items-center gap-2">
    <Button onClick={exportToPDF} variant="outline">
      {/* <FileText className="w-4 h-4 mr-2" /> */}
      Export PDF
    </Button>
    <Button onClick={exportToExcel} variant="outline">
      {/* <FileSpreadsheet className="w-4 h-4 mr-2" /> */}
      Export Excel
    </Button>
  </div>
</div>
      <Card>
        <CardContent>
          <div className=" flex justify-between gap-4 items-end mt-4">
            <div className="flex flex-wrap gap-4 items-end flex-1 min-w-0">
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

            <div className="flex flex-wrap gap-4 items-end min-w-[450px] justify-end">
              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <Select
                  value={selectedCategory ?? "all"}
                  onValueChange={(value) =>
                    setSelectedCategory(value === "all" ? null : value)
                  }
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Categories</SelectLabel>
                      <SelectItem value="all">All Categories</SelectItem>
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
                  value={selectedStatus ?? "all"}
                  onValueChange={(value) =>
                    setSelectedStatus(value === "all" ? null : value)
                  }
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Status</SelectLabel>
                      <SelectItem value="all">All Statuses</SelectItem>
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
        </CardContent>
      </Card>
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

      <div className="flex gap-6">
        <Card className="flex-1 h-[340px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Expense by Category</CardTitle>
            <CardDescription className="text-sm">
              Distribution of expenses by category for {getDateFilterDescription()}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] pt-0">
            <Pie
              data={expenseByCategoryData}
              options={{
                ...chartOptions,
                maintainAspectRatio: false,
                plugins: {
                  ...chartOptions.plugins,
                  legend: { position: "right" },
                  tooltip: {
                    callbacks: {
                      label: function (context) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        return `${label}: ₹${value.toLocaleString('en-IN')}`;
                      },
                    },
                  },
                  title: { display: false },
                },
              }}
            />
          </CardContent>
        </Card>

        <Card className="flex-1 h-[340px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Monthly Approved Rejected & Pending Amount</CardTitle>
            <CardDescription className="text-sm">
              Month-wise total amount for {getDateFilterDescription()}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] pt-0">
            <Line
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
                        const value = context.parsed.y || 0;
                        return `₹${value.toLocaleString('en-IN')}`;
                      },
                    },
                  },
                },
                scales: {
                  y: {
                    ticks: {
                      callback: (value) => `₹${value.toLocaleString('en-IN')}`,
                    },
                    beginAtZero: true,
                  },
                },
              }}
            />
          </CardContent>
        </Card>
      </div>
      <Card className="h-[340px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Weekly Approved, Pending & Rejected Amount</CardTitle>
          <CardDescription className="text-sm">
            Weekly average and  totals for {getDateFilterDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[260px] pt-0">
          <Line
            data={weeklyExpenseData}
            options={{
              ...chartOptions,
              maintainAspectRatio: false,
              plugins: {
                ...chartOptions.plugins,
                title: {
                  display: false,
                },
                tooltip: {
                  callbacks: {
                    label: function (context) {
                      const label = context.dataset.label || '';
                      const value = context.parsed.y || 0;
                      return `${label}: ₹${value.toLocaleString('en-IN')}`;
                    },
                  },
                },
              },
              scales: {
                y: {
                  ticks: {
                    callback: function (value) {
                      return `₹${value.toLocaleString('en-IN')}`;
                    },
                  },
                },
              },
            }}
          />
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Employee Expense Summary</CardTitle>
            <CardDescription>
              for {getDateFilterDescription()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users.length > 0 ? (
              <div className="flex flex-col gap-6">
                {users.map((user) => {
                  const userRequests = searchFilteredRequests.filter((r) => r.user_id === user.id);
                  const submissionCount = userRequests.length;
                  const total = userRequests.reduce((sum, r) => sum + parseFloat(r.amount ?? "0"), 0);
                  const approved = userRequests
                    .filter((r) => r.status === "Approved")
                    .reduce((sum, r) => sum + parseFloat(r.amount ?? "0"), 0);
                  const pending = userRequests
                    .filter((r) => r.status === "Pending")
                    .reduce((sum, r) => sum + parseFloat(r.amount ?? "0"), 0);

                  return (
                    <Card
                      key={user.id}
                      className="w-full p-6 shadow-sm border rounded-lg h-[120px] flex justify-between items-center"
                    >
                      <div className="flex flex-col justify-center">
                        <div className="text-base font-semibold text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{submissionCount} submissions</div>
                      </div>

                      <div className="flex gap-6 text-sm items-center">
                        <div className="text-center">
                          <div className="text-xs uppercase text-gray-500">Total</div>
                          <div className="text-base font-medium text-gray-800">₹{total.toFixed(2)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs uppercase text-gray-500">Approved</div>
                          <div className="text-base font-medium text-green-700">₹{approved.toFixed(2)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs uppercase text-gray-500">Pending</div>
                          <div className="text-base font-medium text-yellow-700">₹{pending.toFixed(2)}</div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-sm text-gray-500 mt-4">No team members found.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}