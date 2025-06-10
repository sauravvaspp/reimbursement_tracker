'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { createExpenseRequest, fetchUserBudget, fetchUserManager, uploadReceipts } from '@/lib/expenses/action';

const supabase = createClient();

type SubmitExpenseProps = {
  userId: string | null;
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

const expenseSchema = z.object({
  description: z.string().min(3, "Description must be at least 3 characters"),
  amount: z.number().min(0.01, "Amount must be at least ₹0.01"),
  category: z.string().min(1, "Please select a category"),
  expenseDate: z.string().min(1, "Expense date is required"),
  merchant: z.string().min(2, "Merchant name must be at least 2 characters"),
  notes: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

const SubmitExpense: React.FC<SubmitExpenseProps> = ({ userId }) => {
  const [receiptFiles, setReceiptFiles] = useState<File[]>([]);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [availableBudget, setAvailableBudget] = useState<number | null>(null);
  const [loadingBudget, setLoadingBudget] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    setError,
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: '',
      amount: 0,
      category: '',
      expenseDate: '',
      merchant: '',
      notes: '',
    }
  });
  const router = useRouter();

useEffect(() => {
  if (!userId) return;

  const loadBudget = async () => {
    setLoadingBudget(true);
    const available = await fetchUserBudget(userId);
    setAvailableBudget(available);
    setLoadingBudget(false);
  };

  loadBudget();
}, [userId]);
  
  

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setReceiptFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter(file => 
        file.type.startsWith('image/') || file.type === 'application/pdf'
      );
      setReceiptFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setReceiptFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ExpenseFormData) => {
    setMessage('');
  
    if (!userId) {
      setMessage('User ID not provided');
      return;
    }
  
    if (availableBudget !== null && data.amount > availableBudget) {
      setError('amount', {
        type: 'manual',
        message: `Amount exceeds your available budget of ₹${availableBudget.toFixed(2)}`
      });
      return;
    }
  
    setUploading(true);
  
    try {
      const approver = await fetchUserManager(userId);
      if (!approver) {
        setUploading(false);
        setMessage('Could not find manager for the user.');
        return;
      }
  
      const inserted = await createExpenseRequest(userId, data, approver);
  
      if (receiptFiles.length > 0) {
        await uploadReceipts(userId, inserted.id, receiptFiles);
      }
  
      setMessage('Expense submitted successfully!');
      router.push('/requests');
      reset();
      setReceiptFiles([]);
      setAvailableBudget(prev => prev !== null ? prev - data.amount : null);
    } catch (error: any) {
      setMessage(`Error: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Submit New Expense</CardTitle>
          <CardDescription className="text-lg">
            Fill out the form below to request reimbursement for your business expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label htmlFor="description" className="text-base">
                  Description *
                </Label>
                <Input 
                  id="description" 
                  type="text" 
                  {...register('description')}
                  placeholder="Brief description of the expense"
                  className="h-12 text-base"
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description.message}</p>
                )}
              </div>

              <div className="space-y-4">
                <Label htmlFor="amount" className="text-base">
                  Amount *
                  {availableBudget !== null && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      (Available: ₹{availableBudget.toFixed(2)})
                    </span>
                  )}
                </Label>
                <Input
                  id="amount"
                  type="number"
                  {...register('amount', { valueAsNumber: true })}
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  className="h-12 text-base"
                />
                {errors.amount && (
                  <p className="text-sm text-red-500">{errors.amount.message}</p>
                )}
              </div>

              <div className="space-y-4">
                <Label htmlFor="category" className="text-base">
                  Category *
                </Label>
                <Select 
                  value={watch('category')} 
                  onValueChange={(value) => setValue('category', value)}
                >
                  <SelectTrigger id="category" aria-label="Category" className="h-12 text-base">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Expense Categories</SelectLabel>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat} className="text-base">{cat}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-red-500">{errors.category.message}</p>
                )}
              </div>

              <div className="space-y-4">
                <Label htmlFor="expenseDate" className="text-base">
                  Expense Date *
                </Label>
                <Input
                  id="expenseDate"
                  type="date"
                  {...register('expenseDate')}
                  className="h-12 text-base"
                />
                {errors.expenseDate && (
                  <p className="text-sm text-red-500">{errors.expenseDate.message}</p>
                )}
              </div>

              <div className="space-y-4">
                <Label htmlFor="merchant" className="text-base">
                  Merchant *
                </Label>
                <Input
                  id="merchant"
                  type="text"
                  {...register('merchant')}
                  placeholder="Where was this expense incurred?"
                  className="h-12 text-base"
                />
                {errors.merchant && (
                  <p className="text-sm text-red-500">{errors.merchant.message}</p>
                )}
              </div>

              <div className="space-y-4">
                <Label htmlFor="notes" className="text-base">
                  Notes
                </Label>
                <Input
                  id="notes"
                  type="text"
                  {...register('notes')}
                  placeholder="Additional details (optional)"
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-4 lg:col-span-2">
                <Label className="text-base">Receipts (images/pdf)</Label>
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center ${isDragging ? 'border-primary bg-primary/10' : 'border-border'}`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center justify-center gap-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-10 h-10 text-muted-foreground"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" x2="12" y1="3" y2="15" />
                    </svg>
                    <p className="text-base text-muted-foreground">
                      {isDragging ? 'Drop files here' : 'Drag & drop files here, or click to select'}
                    </p>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="lg" 
                      className="mt-2 px-6 py-3"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      Select Files
                    </Button>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Upload clear photos or scans of your receipts (multiple files allowed)
                </p>

                {receiptFiles.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h4 className="text-base font-medium">Selected Files:</h4>
                    <ul className="space-y-3">
                      {receiptFiles.map((file, index) => (
                        <li key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="w-5 h-5 text-muted-foreground"
                            >
                              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            <span className="text-base truncate max-w-xs">{file.name}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="lg"
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={uploading || loadingBudget} 
                className="w-full md:w-auto px-8 py-4 text-lg"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Submit Expense'
                )}
              </Button>
            </div>

            {message && (
              <Alert variant={message.includes('success') ? 'default' : 'destructive'} className="mt-6">
                <AlertDescription className="text-base">
                  {message}
                </AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubmitExpense;