import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  'https://pvqvpxcatnelycvdvhng.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2cXZweGNhdG5lbHljdmR2aG5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODU5MTQ5NSwiZXhwIjoyMDY0MTY3NDk1fQ.N296yCJYWZcx-zFOaiNA9F4WEURyWnDup-vCWOgovzQ',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
)

export async function resetPassword(userId: string, newPassword: string) {
  if (!userId) throw new Error('User ID is required')
  if (!newPassword || newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters')
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: newPassword
  })

  if (error) {
    console.error('Password reset failed:', error)
    throw new Error(error.message || 'Failed to reset password')
  }

  return { success: true }
}