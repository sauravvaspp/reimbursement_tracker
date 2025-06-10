"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { RequestActions } from "@/components/manager/RequestActions";
import { CheckCircle2 } from "lucide-react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
} from "@/components/ui/select";
interface User {
  name: string;
}

interface Request {
  id: string;
  amount: string;
  status: string;
  expense_date: string | null;
  category: string | null;
  user_id: string;
  users: User[];
  description?: string;
  receipt_url?: string;
  approval_comments?: string;
  created_at?: string;
}

interface RequestsTableProps {
  requests: Request[];
}

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

export function RequestsTable({ requests }: RequestsTableProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const employee = req.users?.[0]?.name?.toLowerCase() ?? "unknown";
      const category = req.category?.toLowerCase() || "";
      const amount = req.amount?.toString() || "";
      const expenseDate = req.expense_date
        ? new Date(req.expense_date).toLocaleDateString("en-GB").toLowerCase()
        : "";
      const created_at = req.created_at
        ? new Date(req.created_at).toLocaleDateString("en-GB").toLowerCase()
        : "";
      const query = search.toLowerCase();

      const matchesSearch =
      employee.includes(query) ||
        category.includes(query) ||
        amount.includes(query) ||
        expenseDate.includes(query) ||
        created_at.includes(query);

        const matchesCategory =
  selectedCategory === "all" || req.category === selectedCategory;

      

      return matchesSearch && matchesCategory;
    });
  }, [requests, search, selectedCategory]);

  return (
    <div className="rounded-md border">
      <div className="p-4 border-b flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />

<Select
  value={selectedCategory}
  onValueChange={(value) => setSelectedCategory(value)}
>
  <SelectTrigger className="h-10 max-w-xs">
    <SelectValue placeholder="Filter by category" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Expense Categories</SelectLabel>
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

      {filteredRequests?.length ? (
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount (₹)</TableHead>
              <TableHead>Expense Date</TableHead>
              <TableHead>Expense Submitted Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.map((req) => (
              <TableRow key={req.id}>
                <TableCell>{req.users?.[0]?.name ?? "Unknown"}</TableCell>
                <TableCell>{req.category ?? "-"}</TableCell>
                <TableCell>{req.description ?? "-"}</TableCell>
                <TableCell>₹{parseFloat(req.amount).toFixed(2)}</TableCell>
                <TableCell>
                  {req.expense_date
                    ? new Date(req.expense_date).toLocaleDateString("en-GB")
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {req.created_at
                    ? new Date(req.created_at).toLocaleDateString("en-GB")
                    : "N/A"}
                </TableCell>
                <TableCell>
                  <RequestActions
                    requestId={req.id}
                    status={req.status}
                    requestDetails={{
                      id: req.id,
                      employee:req.users?.[0]?.name ?? "Unknown",
                      category: req.category ?? "-",
                      amount: parseFloat(req.amount).toFixed(2),
                      status: req.status,
                      expenseDate: req.expense_date
                        ? new Date(req.expense_date).toLocaleDateString("en-GB")
                        : "N/A",
                      description: req.description,
                      receiptUrl: req.receipt_url,
                      comments: req.approval_comments || "",
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="flex flex-col items-center justify-center p-6 border-t bg-white shadow-sm w-full space-y-3 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 stroke-[1.5] mx-auto" />
          <div className="text-lg font-semibold text-gray-800">
            All caught up!
          </div>
          <p className="text-gray-500 text-sm font-light max-w-[240px] mx-auto">
            No matching expense requests.
          </p>
        </div>
      )}
    </div>
  );
}
