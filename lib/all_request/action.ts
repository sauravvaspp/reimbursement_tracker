import { createClient } from "../supabase/client";

export const fetchAllRequests = async () => {
    const supabase = createClient();
    const currentYear = new Date().getFullYear();
  
    const { data, error } = await supabase
      .from('reimbursement_requests')
      .select('id, amount, status, expense_date, category, description, notes, merchant, user_id')
      .gte('expense_date', `${currentYear}-01-01`)
      .lte('expense_date', `${currentYear}-12-31`);
  
    if (error) {
      console.error('Error fetching all requests:', error);
      return { data: null };
    }
  
    return {
      data: data || []
    };
  };
  