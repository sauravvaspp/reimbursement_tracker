'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from '../ui/table';
import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from '../ui/select';
import { Input } from '../ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { MoreHorizontal, Pencil, Trash2,Eye } from 'lucide-react';
import RequestDetailDialog from './RequestDetailDialog';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { fetchRequestsWithApprovers, refetchRequests } from '@/lib/requests/action';

type MyRequestTableProps = {
  userId: string | null;
  onUpdateRequest: (updatedData: Partial<Request> & { id: string }, userId: string | null) => Promise<boolean>;
  onDeleteRequest: (requestId: string) => Promise<boolean>;
};

type Request = {
  id: string;
  amount: number;
  status: string;
  expense_date: string;
  description?: string;
  category?: string;
  merchant?: string;
  approver?: string;
  note?: string;
  approval_comments?: string;
};

type User = {
  id: string;
  name: string;
};

const statusColors: Record<string, string> = {
  Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
  Pending: 'bg-orange-100 text-orange-800',
};

const statusOptions = ['All', 'Approved', 'Rejected', 'Pending'];

const MyRequestTable: React.FC<MyRequestTableProps> = ({ userId, onUpdateRequest, onDeleteRequest }) => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [users, setUsers] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<Request | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      
      const { requests, users } = await fetchRequestsWithApprovers(userId);
      setRequests(requests);
      setUsers(users);
    };
  
    fetchData();
  }, [userId]);

  const handleUpdateRequest = async (updatedData: Partial<Request> & { id: string }) => {
    const success = await onUpdateRequest(updatedData, userId);
    if (!success) return;
  
    setDialogOpen(false);
    const updatedRequests = await refetchRequests(userId);
    setRequests(updatedRequests);
  };

  const handleDeleteRequest = async () => {
    if (!requestToDelete) return;
    
    const success = await onDeleteRequest(requestToDelete.id);
    if (!success) return;

    setRequests((prev) => prev.filter((r) => r.id !== requestToDelete.id));
    setRequestToDelete(null);
    setDeleteDialogOpen(false);
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (statusFilter !== 'All' && req.status !== statusFilter) return false;

      const search = searchTerm.toLowerCase();
      if (!search) return true;

      const fields = [
        req.description,
        req.category,
        req.merchant,
        req.status,
        req.approval_comments,
        users[req.approver || ''] || '',
        new Date(req.expense_date).toLocaleDateString(),
        req.amount.toString(),
      ];

      return fields.some((field) => field?.toLowerCase().includes(search));
    });
  }, [requests, searchTerm, statusFilter, users]);

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <Input
          type="text"
          placeholder="Search reimbursements..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64"
        />

        <Select onValueChange={(value) => setStatusFilter(value)} value={statusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Status</SelectLabel>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectSeparator />
            <SelectScrollUpButton />
            <SelectScrollDownButton />
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table className="min-w-full text-sm text-gray-700">
          <TableCaption className="text-sm text-gray-500 mb-3">
            All your reimbursement requests
          </TableCaption>
          <TableHeader className="border-b">
            <TableRow>
              <TableHead className="px-5 py-3 text-left">Date</TableHead>
              <TableHead className="px-5 py-3 text-left">Description</TableHead>
              <TableHead className="px-5 py-3 text-left">Category</TableHead>
              <TableHead className="px-5 py-3 text-left">Merchant</TableHead>
              <TableHead className="px-5 py-3 text-right">Amount (₹)</TableHead>
              <TableHead className="px-5 py-3 text-center">Status</TableHead>
              <TableHead className="px-5 py-3 text-left">Approver</TableHead>
              <TableHead className="px-5 py-3 text-left">Approver Comment</TableHead>
              <TableHead className="px-5 py-3 text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-gray-500 italic">
                  No requests found.
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request) => (
                <TableRow key={request.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <TableCell className="px-5 py-3">
                    {new Date(request.expense_date).toLocaleDateString("en-GB")}
                  </TableCell>
                  <TableCell className="px-5 py-3">{request.description || '—'}</TableCell>
                  <TableCell className="px-5 py-3">{request.category || '—'}</TableCell>
                  <TableCell className="px-5 py-3">{request.merchant || '—'}</TableCell>
                  <TableCell className="px-5 py-3 text-right font-semibold">
                    {Number(request.amount).toFixed(2)}
                  </TableCell>
                  <TableCell className="px-5 py-3 text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusColors[request.status] ?? 'bg-gray-100 text-gray-700'}`}
                    >
                      {request.status}
                    </span>
                  </TableCell>
                  <TableCell className="px-5 py-3">
                    {request.approver ? users[request.approver] || request.approver : '—'}
                  </TableCell>
                  <TableCell className="px-5 py-3">{request.approval_comments || '—'}</TableCell>
                  <TableCell className="px-5 py-3 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                      <DropdownMenuItem
  onClick={() => {
    setSelectedRequest(request);
    setDialogOpen(true);
  }}
  className="flex items-center gap-2"
>
  {request.status === 'Pending' ? (
    <>
      <Pencil className="h-4 w-4" />
      Edit
    </>
  ) : (
    <>
      <Eye className="h-4 w-4" />
      View
    </>
  )}
</DropdownMenuItem>

                        {request.status === 'Pending' && (
                          <DropdownMenuItem
                            onClick={() => {
                              setRequestToDelete(request);
                              setDeleteDialogOpen(true);
                            }}
                            className="flex items-center gap-2 text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedRequest && (
        <RequestDetailDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          request={selectedRequest}
          approverName={selectedRequest.approver ? users[selectedRequest.approver] : ''}
          onSave={handleUpdateRequest}
        />
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Reimbursement Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRequest}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyRequestTable;