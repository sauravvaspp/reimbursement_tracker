'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Trash2, Pencil, Key } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { EditUserDialog } from "./EditUserDialog";
import { ResetPasswordDialog } from "./ResetPasswordDialog";
import { resetPassword } from '@/lib/users/resetPassword';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectLabel, SelectSeparator, SelectItem } from '../ui/select';

interface UserTableProps {
  users: any[];
  filteredUsers: any[];
  searchTerm: string;
  sortConfig: { key: string; direction: 'ascending' | 'descending' } | null;
  roleFilter: string | null;
  onSearch: (term: string) => void;
  onSort: (key: string) => void;
  onRoleFilter: (role: string | null) => void;
  onDelete: (userId: string) => void;
  onEdit: (userId: string, updatedUser: any) => Promise<void>;
  managers: any[];
}

export function UserTable({
  users,
  filteredUsers,
  searchTerm,
  sortConfig,
  roleFilter,
  onSearch,
  onSort,
  onRoleFilter,
  onDelete,
  onEdit,
  managers,
}: UserTableProps) {
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<any>(null);

  const handleView = (user: any) => {
    setSelectedUser(user);
    setViewDialogOpen(true);
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (user: any) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleResetPasswordClick = (user: any) => {
    setSelectedUser(user);
    setResetPasswordDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      onDelete(selectedUser.id);
      setDeleteDialogOpen(false);
    }
  };

  const handleSave = async (updatedUser: any) => {
    if (selectedUser) {
      await onEdit(selectedUser.id, updatedUser);
    }
  };

  const handleResetPassword = async (newPassword: string) => {
    if (selectedUser) {
      await resetPassword(selectedUser.id, newPassword);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center w-full mb-4">
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          className="max-w-sm"
        />

        <Select
          value={roleFilter ?? "all"}
          onValueChange={(value) => onRoleFilter(value === "all" ? null : value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Roles</SelectLabel>
              <SelectSeparator />
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Manager">Manager</SelectItem>
              <SelectItem value="Employee">Employee</SelectItem>
              <SelectItem value="HR">HR</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Reimbursement Budget</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phone}</TableCell>
                <TableCell>{user.reimbursement_budget}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.address}</TableCell>
                <TableCell>
                  {user.managerID ? users.find(u => u.id === user.managerID)?.name : '-'}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {/* <DropdownMenuItem onClick={() => handleView(user)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem> */}
                      <DropdownMenuItem onClick={() => handleEdit(user)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleResetPasswordClick(user)}>
                        <Key className="mr-2 h-4 w-4" />
                        Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDeleteClick(user)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <p className="font-medium">Name</p>
                <p>{selectedUser.name}</p>
              </div>
              <div>
                <p className="font-medium">Email</p>
                <p>{selectedUser.email}</p>
              </div>
              <div>
                <p className="font-medium">Phone</p>
                <p>{selectedUser.phone}</p>
              </div>
              <div>
                <p className="font-medium">Address</p>
                <p>{selectedUser.address}</p>
              </div>
              <div>
                <p className="font-medium">Role</p>
                <p>{selectedUser.role}</p>
              </div>
              <div>
                <p className="font-medium">Manager</p>
                <p>
                  {selectedUser.managerID
                    ? users.find(u => u.id === selectedUser.managerID)?.name
                    : '-'}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedUser && (
        <EditUserDialog
          user={selectedUser}
          managers={managers}
          isOpen={editDialogOpen}
          setIsOpen={setEditDialogOpen}
          onSave={handleSave}
        />
      )}

      {selectedUser && (
        <ResetPasswordDialog
          isOpen={resetPasswordDialogOpen}
          setIsOpen={setResetPasswordDialogOpen}
          onReset={handleResetPassword}
        />
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
