'use client';

import React from "react";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
} from "@/components/ui/select";
import { Label } from "../ui/label";
interface AddUserDialogProps {
  form: {
    name: string;
    email: string;
    password: string;
    phone: string;
    address: string;
    role: string;
    managerID: string;
    reimbursement_budget: number;
  };
  setForm: React.Dispatch<React.SetStateAction<AddUserDialogProps["form"]>>;
  managers: any[];
  loading: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: () => Promise<{ success: boolean; error?: string }>;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  resetForm: () => void;
  filteredUsers: any[];
}

const userSchema = (filteredUsers: any[]) =>
  z.object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(50, "Name must be at most 50 characters")
      .refine((val) => val.trim().length > 0, {
        message: "Only spaces are not allowed",
      }),
    email: z.string()
      .email("Invalid email address")
      .refine(
        (email) => !filteredUsers.some(user => user.email === email),
        "Email already exists"
      ),
    password: z.string().superRefine((val, ctx) => {
      if (val.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password must be at least 8 characters",
        });
      }
      if (!/[A-Z]/.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password must include at least one uppercase letter",
        });
      }
      if (!/\d/.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password must include at least one number",
        });
      }
      if (!/[^A-Za-z0-9]/.test(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Password must include at least one special character",
        });
      }
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
    role: z.string().min(1, "Role is required"),
    reimbursement_budget: z.number().min(0, "Budget cannot be negative"),
    managerID: z.string().optional()
  }).superRefine((data, ctx) => {
    if (data.role !== "Admin" && data.role !== "Finance" && !data.managerID) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Manager is required for this role",
        path: ["managerID"],
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

type UserFormData = z.infer<ReturnType<typeof userSchema>>;

export default function AddUserDialog({
  form,
  setForm,
  managers,
  loading,
  handleChange,
  handleSubmit,
  isOpen,
  setIsOpen,
  resetForm,
  filteredUsers
}: AddUserDialogProps) {
  const {
    register,
    handleSubmit: formHandleSubmit,
    formState: { errors },
    setValue,
    trigger,
    reset,
    setError,
    watch
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema(filteredUsers)),
    defaultValues: form,
    mode: 'onChange'
  });

  const onSubmit = async (data: UserFormData) => {
    const result = await handleSubmit();
    if (!result.success && result.error) {
      setError('root', {
        type: 'manual',
        message: result.error
      });
    }
  };

  const handleRoleChange = (role: string) => {
    setForm(prev => ({ ...prev, role }));
    setValue('role', role, { shouldValidate: true });
    trigger('managerID');
  };

  const handleManagerChange = (managerID: string) => {
    setForm(prev => ({ ...prev, managerID }));
    setValue('managerID', managerID, { shouldValidate: true });
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
      reset();
    }
    setIsOpen(open);
  };

  React.useEffect(() => {
    const subscription = watch((value) => {
      setForm(prev => ({
        ...prev,
        ...value
      }));
    });
    return () => subscription.unsubscribe();
  }, [watch, setForm]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={handleDialogOpenChange}
    >
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">Add User</Button>
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 bg-black/50" />
        <DialogContent className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Fill in the details to create a user
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={formHandleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
            {errors.root && (
              <p className="text-red-500 text-sm">{errors.root.message}</p>
            )}

            <div>
              <Label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</Label>
              <Input
                id="name"
                {...register('name')}
                name="name"
                onChange={handleChange}
                placeholder="Name"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</Label>
              <Input
                id="email"
                {...register('email')}
                name="email"
                type="email"
                onChange={handleChange}
                placeholder="Email"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</Label>
              <Input
                id="password"
                {...register('password')}
                name="password"
                type="password"
                onChange={handleChange}
                placeholder="Password"
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            </div>


            <div>
              <Label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</Label>
              <Input
                id="phone"
                {...register('phone')}
                name="phone"
                onChange={handleChange}
                placeholder="Phone"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
            </div>


            <div>
              <Label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</Label>
              <Input
                id="address"
                {...register('address')}
                name="address"
                onChange={handleChange}
                placeholder="Address"
              />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
            </div>


            <div className="w-full">
              <label className="block mb-1 text-sm font-medium">Role</label>
              <Select
                value={form.role || ""}
                onValueChange={(value) => handleRoleChange(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select by Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Roles</SelectLabel>
                    <SelectSeparator />
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Employee">Employee</SelectItem>
                    {/* <SelectItem value="HR">HR</SelectItem> */}
                    <SelectItem value="Finance">Finance</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              {errors.role && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.role.message}
                </p>
              )}
            </div>



            {form.role && form.role !== "Admin" && form.role !== "Finance" && (
  <div className="w-full">
    <label className="block mb-1 text-sm font-medium">Manager</label>
    <Select
      value={form.managerID || ""}
      onValueChange={(value) => handleManagerChange(value)}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select Manager" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Select Manager</SelectLabel>
          <SelectSeparator />
          {(form.role === "Manager"
            ? managers.filter((manager) => manager.role === "Admin")
            : managers.filter((manager) => manager.role !== "Finance")
          ).map((manager) => (
            <SelectItem key={manager.id} value={manager.id}>
              {manager.name} ({manager.role})
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>

    {errors.managerID && (
      <p className="text-red-500 text-sm mt-1">
        {errors.managerID.message}
      </p>
    )}
  </div>
)}






{form.role && form.role !== "Admin" && form.role !== "Finance" && (
  <div>
    <Label htmlFor="reimbursement_budget" className="block text-sm font-medium text-gray-700 mb-1">Reimbursement Budget</Label>
    <Input
      id="reimbursement_budget"
      {...register('reimbursement_budget', { valueAsNumber: true })}
      name="reimbursement_budget"
      type="number"
      onChange={(e) => {
        handleChange(e);
        setValue('reimbursement_budget', Number(e.target.value), { shouldValidate: true });
      }}
      placeholder="Reimbursement Budget"
    />
    {errors.reimbursement_budget && (
      <p className="text-red-500 text-sm mt-1">
        {errors.reimbursement_budget.message}
      </p>
    )}
  </div>
)}

            <DialogFooter className="mt-4">
              
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}