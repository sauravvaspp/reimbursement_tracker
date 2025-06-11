import { createClient } from "../supabase/client";
export type User = {
    id: string;
    name: string;
    email: string;
    role: string;
    reimbursement_budget: string | number;
  };
  
  export type Request = {
    description: string;
    amount: string | number;
    category: string;
    expense_date: string;
    status: string;
    user_id: string;
    created_at: string;
  };
  export async function fetchUserByIdDashboard(userId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, role, reimbursement_budget")
      .eq("id", userId)
      .single();
  
    if (error) throw new Error(error.message);
    return data;
  }
  
  export async function fetchRequestsByUserIdDashboard(userId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("reimbursement_requests")
      .select(
        "description, amount, category, expense_date, status, user_id, created_at"
      )
      .eq("user_id", userId);
  
    if (error) throw new Error(error.message);
    return data || [];
  }
export const fetchUsersForAdmin = async () => {
    const supabase = createClient();
  
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, role, reimbursement_budget")
      .not("role", "in", '("Admin","Finance")');
  
    if (error) throw new Error(error.message);
    return data || [];
  };
  
  export const fetchReimbursementRequestsForAdmin = async () => {
    const supabase = createClient();
  
    const { data, error } = await supabase
      .from("reimbursement_requests")
      .select(
        "description, amount, category, expense_date, status, user_id, created_at"
      );
  
    if (error) throw new Error(error.message);
    return data || [];
  };

  export async function fetchManagerUsersAndRequests(managerID: string) {
    const supabase = createClient();
  
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id, name, email, role, reimbursement_budget")
      .eq("managerID", managerID);
  
    if (usersError) {
      throw new Error(`Users fetch error: ${usersError.message}`);
    }
  
    const assignedUserIds = usersData?.map((u: { id: any; }) => u.id) || [];
  
    if (assignedUserIds.length === 0) {
      return { users: usersData || [], requests: [] };
    }
  
    const { data: requestsData, error: reqError } = await supabase
      .from("reimbursement_requests")
      .select("description, amount, category, expense_date, status, user_id, created_at")
      .in("user_id", assignedUserIds);
  
    if (reqError) {
      throw new Error(`Requests fetch error: ${reqError.message}`);
    }
  
    return {
      users: usersData || [],
      requests: requestsData || [],
    };
  }

  export const fetchUserById = async (userId: string) => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, reimbursement_budget')
      .eq('id', userId)
      .single();
  
    if (error) throw new Error(error.message);
    return data;
  };
  
  export const fetchReimbursementRequestsByUserId = async (userId: string) => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('reimbursement_requests')
      .select('description, amount, category, expense_date, status, user_id, created_at')
      .eq('user_id', userId);
  
    if (error) throw new Error(error.message);
    return data || [];
  };

  export async function fetchManagerReportsData(managerID: string) {
    const supabase = await createClient();
  
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id, name, email, role, reimbursement_budget")
      .eq("managerID", managerID);
  
    if (usersError) throw new Error(usersError.message);
  
    const assignedUserIds = usersData?.map((u: { id: any; }) => u.id) || [];
  
    const { data: reqs, error: reqError } = await supabase
      .from("reimbursement_requests")
      .select("description, amount, category, expense_date, status, user_id, created_at")
      .in("user_id", assignedUserIds);
  
    if (reqError) throw new Error(reqError.message);
  
    return {
      users: usersData,
      requests: reqs || [],
    };
  }
  export async function fetchUsersAndRequests() {
    const supabase = await createClient();
  
    // Fetch all users except Admin and Finance
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name, email, role, reimbursement_budget")
  
    if (usersError) {
      throw new Error(usersError.message);
    }
  
    // Fetch all reimbursement requests
    const { data: requests, error: reqError } = await supabase
      .from("reimbursement_requests")
      .select(
        "description, amount, category, expense_date, status, user_id, created_at"
      );
  
    if (reqError) {
      throw new Error(reqError.message);
    }
  
    return { users: users || [], requests: requests || [] };
  }