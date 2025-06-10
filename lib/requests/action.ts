
import { createClient } from "../supabase/client";

export const fetchRequestData = async (userId: string | null) => {
  if (!userId) return { data: null, budget: 0 };

  const supabase = createClient();
  const currentYear = new Date().getFullYear();

  const { data, error } = await supabase
    .from('reimbursement_requests')
    .select('id, amount, status, expense_date, category, description, notes, merchant')
    .eq('user_id', userId)
    .gte('expense_date', `${currentYear}-01-01`)
    .lte('expense_date', `${currentYear}-12-31`);

  if (error) {
    console.error('Error fetching requests:', error);
    return { data: null, budget: 0 };
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('reimbursement_budget')
    .eq('id', userId)
    .single();

  if (userError) {
    console.error('Error fetching user budget:', userError);
    return { data: null, budget: 0 };
  }

  return {
    data: data || [],
    budget: Number(userData?.reimbursement_budget || 0)
  };
};

export const updateRequest = async (updatedData: any) => {
  const supabase = createClient();
  const { error } = await supabase
    .from('reimbursement_requests')
    .update({
      expense_date: updatedData.expense_date,
      category: updatedData.category,
      description: updatedData.description,
      amount: parseFloat(updatedData.amount as any),
      notes: updatedData.note,
      merchant: updatedData.merchant,
    })
    .eq('id', updatedData.id);

  return { error };
};

export const deleteRequest = async (requestId: string) => {
  const supabase = createClient();
  const { error } = await supabase
    .from('reimbursement_requests')
    .delete()
    .eq('id', requestId);

  return { error };
};

export const fetchRequestsWithApprovers = async (userId: string | null) => {
    if (!userId) return { requests: [], users: {} };
  
    const supabase = createClient();
    const currentYear = new Date().getFullYear();
  
    const { data: requestsData, error: requestsError } = await supabase
      .from('reimbursement_requests')
      .select('*')
      .eq('user_id', userId)
      .gte('expense_date', `${currentYear}-01-01`)
      .lte('expense_date', `${currentYear}-12-31`);
  
    if (requestsError) {
      console.error('Error fetching requests:', requestsError);
      return { requests: [], users: {} };
    }
  
    const approvers = (requestsData || [])
      .map(r => r.approver)
      .filter(Boolean) as string[];
    const approverIds = [...new Set(approvers)];
  
    const userMap: Record<string, string> = {};
    
    if (approverIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name')
        .in('id', approverIds);
  
      if (usersError) {
        console.error('Error fetching users:', usersError);
      } else {
        usersData?.forEach((user) => {
          userMap[user.id] = user.name;
        });
      }
    }
  
    return {
      requests: requestsData || [],
      users: userMap
    };
  };
  
  export const refetchRequests = async (userId: string | null) => {
    if (!userId) return [];
  
    const supabase = createClient();
    const currentYear = new Date().getFullYear();
  
    const { data: requestsData } = await supabase
      .from('reimbursement_requests')
      .select('*')
      .eq('user_id', userId)
      .gte('expense_date', `${currentYear}-01-01`)
      .lte('expense_date', `${currentYear}-12-31`);
  
    return requestsData || [];
  };

  // Add these to your existing lib/requests.ts
export const fetchUserBudget = async (userId: string) => {
    const supabase = createClient();

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('reimbursement_budget')
      .eq('id', userId)
      .single();
  
    if (userError || !userData) {
      throw userError || new Error('User not found');
    }
  
    return parseFloat(userData.reimbursement_budget) || 0;
  };
  
  export const fetchUsedBudget = async (userId: string) => {
    const supabase = createClient();

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
  
    if (requestsError) throw requestsError;
  
    return requestsData?.reduce((sum, req) => sum + (parseFloat(req.amount) || 0), 0) || 0;
  };
  

  
  export const uploadReceiptFile = async (folderPath: string, file: File) => {
    const supabase = createClient();

    const filePath = `${folderPath}/${file.name}`;
    return await supabase.storage.from('docs').upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });
  };
  
  export const removeReceiptFile = async (filePath: string) => {
    const supabase = createClient();

    return await supabase.storage.from('docs').remove([filePath]);
  };