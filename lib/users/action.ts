'use server';

import { createClient } from "@/lib/supabase/server";
import { cookies } from "@/node_modules/next/headers";
export async function fetchUsers() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("users").select("*");
  if (error) throw error;
  return data || [];
}

export async function fetchManagers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .neq("role", "Employee");
  if (error) throw error;
  return data || [];
}

export async function createUser(formData: {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  role: string;
  managerID: string;
  reimbursement_budget: number;
}) {
  const supabase = await createClient();

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: formData.email,
    password: formData.password,
    email_confirm: true,
    user_metadata: {
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      role: formData.role,
      email_verified: true,
    }
  });

  if (authError) throw authError;
  if (!authUser.user) throw new Error('User creation failed');

  const { error } = await supabase
    .from('users')
    .insert({
      id: authUser.user.id,
      email: formData.email,
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      role: formData.role,
      managerID: formData.managerID,
      reimbursement_budget: formData.reimbursement_budget
    });

  if (error) throw error;
}


export async function updateUser(userId: string, formData: {
  name: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  managerID: string;
  reimbursement_budget: number;
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('users')
    .update({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      role: formData.role,
      managerID: formData.managerID,
      reimbursement_budget: formData.reimbursement_budget
    })
    .eq('id', userId);

  if (error) throw error;
}



export async function deleteUser(userId: string) {
  const supabase = await createClient();
  console.log("User ID:", userId);

  try {
    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)
      .select();

    if (error) {
      console.error("Error deleting from users table:", error);
      return { success: false, error: error.message };
    }

    if (data && data.length > 0) {
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) {
        console.error("Error deleting from Supabase Auth:", authError);
        return { success: false, error: authError.message };
      }

      return {
        success: true,
        message: "User deleted from both database and authentication",
        data,
      };
    }

    return { success: false, error: "No user found with this ID" };
  } catch (error) {
    console.error("Unexpected error while deleting user:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

// export async function resetPassword(userId: string, newPassword: string) {
//   const supabase = createClient();

//   // Type-safe admin operation
//   const { error } = await supabase.auth.admin.updateUserById(userId, {
//     password: newPassword
//   });

//   if (error) {
//     console.error('Password reset error:', error);
//     throw new Error(error.message);
//   }

//   return { success: true };
// }