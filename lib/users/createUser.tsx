import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  'https://pvqvpxcatnelycvdvhng.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2cXZweGNhdG5lbHljdmR2aG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODU5MTQ5NSwiZXhwIjoyMDY0MTY3NDk1fQ.N296yCJYWZcx-zFOaiNA9F4WEURyWnDup-vCWOgovzQ',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

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
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
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

  const { error } = await supabaseAdmin
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
