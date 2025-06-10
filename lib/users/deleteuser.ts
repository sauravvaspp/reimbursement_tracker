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

export async function deleteUser(userId: string) {
  try {
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (authError) throw authError

    const { error: dbError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId)

    if (dbError) throw dbError

    return { 
      success: true,
      message: 'User deleted from both Auth and database'
    }

  } catch (error: any) {
    console.error('Delete failed:', error)
    return {
      success: false,
      error: error.message || 'Failed to delete user'
    }
  }
}