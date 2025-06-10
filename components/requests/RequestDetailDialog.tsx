'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
} from '../ui/select';
import { createClient } from '@/lib/supabase/client';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Label } from '../ui/label';

const categories = [
  'Meals and Entertainment',
  'Transportation',
  'Accommodation',
  'Office Supplies',
  'Training and Development',
  'Software and Subscriptions',
  'Marketing',
  'Other',
];

const statusColors: Record<string, string> = {
  Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
  Pending: 'bg-orange-100 text-orange-800',
};

const supabase = createClient();

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
  user_id?: string;
};

type FileInfo = {
  name: string;
  url: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: Request;
  approverName: string;
  onSave: (updatedData: Partial<Request> & { id: string }) => void;
};

const RequestDetailDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  request,
  approverName,
  onSave,
}) => {
  const isEditable = request.status === 'Pending';
  const [receiptFiles, setReceiptFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [availableBudget, setAvailableBudget] = useState<number | null>(null);
  const [loadingBudget, setLoadingBudget] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderPath = `${request.user_id}/reimbursement_requests/${request.id}`;

  const fetchBudget = async () => {
    if (!request.user_id) return;
  
    try {
      setLoadingBudget(true);
  
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('reimbursement_budget')
        .eq('id', request.user_id)
        .single();
  
      if (userError || !userData) throw userError || new Error('User not found');
  
      const totalBudget = parseFloat(userData.reimbursement_budget) || 0;
  
      // Get the current year
      const currentYear = new Date().getFullYear();
      const startOfYear = `${currentYear}-01-01`;
      const endOfYear = `${currentYear}-12-31`;
  
      const { data: requestsData, error: requestsError } = await supabase
        .from('reimbursement_requests')
        .select('amount, status, expense_date')
        .eq('user_id', request.user_id)
        .in('status', ['Pending', 'Approved'])
        .gte('expense_date', startOfYear)
        .lte('expense_date', endOfYear);
  
      if (requestsError) throw requestsError;
  
      const usedAmount =
        requestsData?.reduce((sum, req) => sum + (parseFloat(req.amount) || 0), 0) || 0;
  
      setAvailableBudget(totalBudget - usedAmount);
    } catch (error) {
      console.error('Error fetching budget:', error);
      setAvailableBudget(null);
    } finally {
      setLoadingBudget(false);
    }
  };
  

  const expenseSchema = z.object({
    description: z.string().min(3, 'Description must be at least 3 characters'),
    amount: z
      .string()
      .refine((val) => !isNaN(Number(val)) && Number(val) >= 0.01, {
        message: 'Amount must be at least ₹0.01',
      })
      .refine(
        (val) =>
          availableBudget === null || parseFloat(val) <= availableBudget,
        {
          message: 'Amount exceeds available budget',
        }
      ),
    category: z.string().min(1, 'Please select a category'),
    expense_date: z.string().min(1, 'Expense date is required'),
    merchant: z.string().min(2, 'Merchant name must be at least 2 characters'),
    note: z.string().optional(),
  });

  type ExpenseFormData = z.infer<typeof expenseSchema>;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: request.description || '',
      amount: request.amount.toString(),
      category: request.category || '',
      expense_date: request.expense_date,
      merchant: request.merchant || '',
      note: request.note || '',
    },
  });

  const fetchFiles = async () => {
    if (!request?.id || !request?.user_id) return;

    const { data, error } = await supabase.storage.from('docs').list(folderPath);
    if (error) return;

    const files: FileInfo[] =
      data
        ?.filter((file) => file.name.match(/\.(jpg|jpeg|png|webp|gif|pdf|docx?|xlsx?|txt)$/i))
        .map((file) => {
          const { data: urlData } = supabase.storage
            .from('docs')
            .getPublicUrl(`${folderPath}/${file.name}`);
          return { name: file.name, url: urlData.publicUrl };
        }) || [];

    setReceiptFiles(files);
  };

  useEffect(() => {
    if (open) {
      reset({
        description: request.description || '',
        amount: request.amount.toString(),
        category: request.category || '',
        expense_date: request.expense_date,
        merchant: request.merchant || '',
        note: request.note || '',
      });
      fetchBudget();
      fetchFiles();
    }
  }, [open, request, reset]);

  const onSubmit = async (data: ExpenseFormData) => {
    setLoading(true);
    await onSave({ ...data, amount: parseFloat(data.amount), id: request.id });
    setLoading(false);
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const filePath = `${folderPath}/${file.name}`;
      await supabase.storage.from('docs').upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });
    }

    e.target.value = '';
    await fetchFiles();
    setUploading(false);
  };

  const handleRemoveFile = async (fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return;
    setLoading(true);
    const { error } = await supabase.storage.from('docs').remove([`${folderPath}/${fileName}`]);
    if (!error) await fetchFiles();
    setLoading(false);
  };

  const handleViewFile = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 bg-black/50" />
        <DialogContent className="bg-white p-6 rounded-lg max-w-3xl mx-auto overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Edit Expense Details</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Modify editable fields of this expense request
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-4">
                <div>
                  <Label className="text-base">Date *</Label>
                  <Input type="date" disabled={!isEditable} {...register('expense_date')} />
                  {errors.expense_date && (
                    <p className="text-red-600 text-sm mt-1">{errors.expense_date.message}</p>
                  )}
                </div>

                <div>
                  <Label className="text-base">Category *</Label>
                  <Select
                    value={watch('category')}
                    onValueChange={(val) => setValue('category', val)}
                    disabled={!isEditable}
                  >
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Expense Categories</SelectLabel>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-base">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-red-600 text-sm mt-1">{errors.category.message}</p>
                  )}
                </div>

                <div>
                  <Label className="text-base">Merchant *</Label>
                  <Input type="text" disabled={!isEditable} {...register('merchant')} />
                  {errors.merchant && (
                    <p className="text-red-600 text-sm mt-1">{errors.merchant.message}</p>
                  )}
                </div>

                <div>
                  <Label className="text-base">
                    Amount *
                    {availableBudget !== null && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        (Available: ₹{availableBudget.toFixed(2)})
                      </span>
                    )}
                  </Label>
                  <Input type="number" step="0.01" disabled={!isEditable} {...register('amount')} />
                  {errors.amount && (
                    <p className="text-red-600 text-sm mt-1">{errors.amount.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-base">Description *</Label>
                  <Textarea disabled={!isEditable} {...register('description')} />
                  {errors.description && (
                    <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
                  )}
                </div>

                <div>
                  <Label className="text-base">Status</Label>
                  <span
                    className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${
                      statusColors[request.status] ?? 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {request.status}
                  </span>
                </div>

                <div>
                  <Label className="text-base">Approver</Label>
                  <p className="text-gray-800">{approverName || '—'}</p>
                </div>

                <div>
                  <Label className="text-base">Notes</Label>
                  <Textarea disabled={!isEditable} {...register('note')} />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <p className="text-gray-700 font-medium">Uploaded Receipts</p>
                {isEditable && (
                  <Button type="button" onClick={handleUploadClick} disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Upload Document'}
                  </Button>
                )}
                <input
                  type="file"
                  multiple
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.xlsx,.txt"
                />
              </div>

              {receiptFiles.length > 0 ? (
                <ul className="space-y-2 max-h-40 overflow-auto mt-2">
                  {receiptFiles.map((file, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        📄 <span className="text-base truncate max-w-xs">{file.name}</span>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewFile(file.url)}
                        >
                          View
                        </Button>
                        {isEditable && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFile(file.name)}
                            disabled={loading}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-gray-500">No files uploaded yet.</p>
              )}
            </div>

            <DialogFooter className="mt-8 flex justify-between">
              <DialogClose asChild>
                <Button variant="secondary" disabled={loading || uploading}>
                  Cancel
                </Button>
              </DialogClose>
              {isEditable && (
                <Button type="submit" disabled={loading || uploading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

export default RequestDetailDialog;
