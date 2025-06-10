import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export async function fetchUserBudget(userId: string): Promise<number | null> {
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('reimbursement_budget')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      throw userError || new Error('User data not found');
    }

    const yearlyBudget = parseFloat(userData.reimbursement_budget) || 0;

    const currentYear = new Date().getFullYear();
    const startOfYear = `${currentYear}-01-01`;
    const endOfYear = `${currentYear}-12-31`;

    const { data: requestsData, error: requestsError } = await supabase
      .from('reimbursement_requests')
      .select('amount, status, expense_date')
      .eq('user_id', userId)
      .in('status', ['Pending', 'Approved'])
      .gte('expense_date', startOfYear)
      .lte('expense_date', endOfYear);

    if (requestsError) {
      throw requestsError;
    }

    const usedAmount = requestsData?.reduce((sum, req) => {
      return sum + (parseFloat(req.amount) || 0);
    }, 0) || 0;

    return yearlyBudget - usedAmount;
  } catch (error) {
    console.error('Error fetching budget:', error);
    return null;
  }
}

export async function fetchUserManager(userId: string): Promise<string | null> {
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('managerID')
      .eq('id', userId)
      .single();

    if (userError || !userData?.managerID) {
      throw userError || new Error('Manager not found');
    }

    return userData.managerID;
  } catch (error) {
    console.error('Error fetching manager:', error);
    return null;
  }
}

export async function createExpenseRequest(userId: string, data: any, approver: string) {
  try {
    const { data: inserted, error: insertError } = await supabase
      .from('reimbursement_requests')
      .insert([{
        user_id: userId,
        description: data.description,
        amount: data.amount,
        category: data.category,
        expense_date: data.expenseDate,
        merchant: data.merchant,
        notes: data.notes,
        status: "Pending",
        receipt_url: null,
        approver,
      }])
      .select()
      .single();

    if (insertError || !inserted) {
      throw insertError || new Error('Failed to insert reimbursement request');
    }

    return inserted;
  } catch (error) {
    console.error('Error creating expense request:', error);
    throw error;
  }
}

export async function uploadReceipts(userId: string, expenseId: string, files: File[]) {
  try {
    const uploadPromises = files.map(async (file, index) => {
      const filePath = `${userId}/reimbursement_requests/${expenseId}/${Date.now()}_${index}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('docs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('docs')
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    });

    const receipt_urls = await Promise.all(uploadPromises);

    const { error: updateError } = await supabase
      .from('reimbursement_requests')
      .update({ receipt_url: receipt_urls.join(',') })
      .eq('id', expenseId);

    if (updateError) throw updateError;

    return receipt_urls;
  } catch (error) {
    console.error('Error uploading receipts:', error);
    throw error;
  }
}
