'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React from "react";
import { z } from "zod";

interface EditUserDialogProps {
  user: any;
  managers: any[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSave: (updatedUser: any) => Promise<void>;
}

const createUserSchema = (managers: any[]) =>
  z.object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(50, "Name must be at most 50 characters")
      .refine((val) => val.trim().length > 0, {
        message: "Only spaces are not allowed",
      }),
    phone: z
      .string()
      .min(10, "Phone number must be at least 10 digits")
      .max(13, "Phone number must not exceed 13 digits"),
    address: z
      .string()
      .min(1, "Address is required")
      .max(250, "Address must not exceed 250 characters")
      .refine((val) => val.trim().length > 0, {
        message: "Only spaces are not allowed",
      }),
    reimbursement_budget: z.coerce.number()
      .min(0, "Budget cannot be negative")
      .default(0),
    role: z.string().min(1, "Role is required"),
    managerID: z.string().nullable().optional()
  }).superRefine((data, ctx) => {
    if (data.role !== 'Admin' && data.role !== 'Finance' && !data.managerID) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Manager is required for this role",
        path: ["managerID"]
      });
    }
  
    if (data.managerID && !managers.some(m => m.id === data.managerID)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selected manager is invalid",
        path: ["managerID"]
      });
    }
  
    if (data.role !== "Admin" && data.role !== "Finance") {
      if (typeof data.reimbursement_budget !== "number" || isNaN(data.reimbursement_budget)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Reimbursement budget is required",
          path: ["reimbursement_budget"],
        });
      } else if (data.reimbursement_budget < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Budget cannot be negative",
          path: ["reimbursement_budget"],
        });
      }
    }
  });
  const handleRoleChange = (value: string) => {
    setForm(prev => ({
      ...prev,
      role: value,
      // Clear budget for Admin/Finance; keep existing otherwise
      reimbursement_budget:
        value === "Admin" || value === "Finance" ? 0 : prev.reimbursement_budget,
      // Optionally clear managerID if Admin/Finance (not required, but helps with UX)
      managerID: value === "Admin" || value === "Finance" ? null : prev.managerID,
    }));
  
    // Clear related validation errors if role changes to Admin or Finance
    if ((value === "Admin" || value === "Finance")) {
      setErrors(prev => ({
        ...prev,
        managerID: '',
        reimbursement_budget: '',
      }));
    }
  };
    


export function EditUserDialog({ user, managers, isOpen, setIsOpen, onSave }: EditUserDialogProps) {
  const [form, setForm] = React.useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    role: user?.role || '',
    managerID: user?.managerID || null,
    reimbursement_budget: Number(user?.reimbursement_budget) || 0
  });
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        managerID: user.managerID || null,
        reimbursement_budget: user.reimbursement_budget || 0
      });
    }
    setErrors({});
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'reimbursement_budget' ? Number(value) : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRoleChange = (value: string) => {
    setForm(prev => ({
      ...prev,
      role: value,
      reimbursement_budget:
        value === "Admin" || value === "Finance" ? 0 : prev.reimbursement_budget,
      managerID: value === "Admin" || value === "Finance" ? null : prev.managerID,
    }));
  
    if ((value === "Admin" || value === "Finance")) {
      setErrors(prev => ({
        ...prev,
        managerID: '',
        reimbursement_budget: '',
      }));
    }
  };
  

  const handleManagerChange = (value: string) => {
    const managerID = value === "null" ? null : value;
    setForm(prev => ({ ...prev, managerID }));
    if (errors.managerID) {
      setErrors(prev => ({ ...prev, managerID: '' }));
    }
  };

  const handleSubmit = async () => {
    try {
      const userSchema = createUserSchema(managers);
      userSchema.parse(form);
      setLoading(true);
      await onSave(form);
      setIsOpen(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach(issue => {
          const path = issue.path[0];
          if (path) {
            newErrors[path] = issue.message;
          }
        });
        setErrors(newErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update the user details below.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              readOnly
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
            />
            {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              value={form.address}
              onChange={handleChange}
            />
            {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={form.role} onValueChange={handleRoleChange}>
  <SelectTrigger>
    <SelectValue placeholder="Select role" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="Admin">Admin</SelectItem>
    <SelectItem value="Manager">Manager</SelectItem>
    <SelectItem value="Employee">Employee</SelectItem>
    <SelectItem value="Finance">Finance</SelectItem>
  </SelectContent>
</Select>
            {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
          </div>
          {form.role && form.role !== "Admin" && form.role !== "Finance" && (
            <div className="space-y-2">
              <Label htmlFor="manager">Manager</Label>
              <Select
                value={form.managerID}
                onValueChange={handleManagerChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  {(form.role === "Manager"
                    ? managers.filter((manager) => manager.role === "Admin")
                    : managers.filter((manager) => manager.role !== "Finance")
                  ).map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.name} ({manager.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.managerID && (
                <p className="text-sm text-red-500">{errors.managerID}</p>
              )}
            </div>
          )}
        </div>
        {form.role && form.role !== "Admin" && form.role !== "Finance" && (
  <div className="space-y-2">
    <Label htmlFor="reimbursement_budget">Reimbursement Budget</Label>
    <Input
      id="reimbursement_budget"
      name="reimbursement_budget"
      type="number"
      value={form.reimbursement_budget}
      onChange={(e) => {
        handleChange({
          target: {
            name: 'reimbursement_budget',
            value: e.target.value
          }
        } as React.ChangeEvent<HTMLInputElement>);
      }}
    />
    {errors.reimbursement_budget && (
      <p className="text-sm text-red-500">{errors.reimbursement_budget}</p>
    )}
  </div>
)}

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}