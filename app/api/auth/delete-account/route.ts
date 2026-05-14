import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const { error } = await adminClient.auth.admin.deleteUser(user.id)

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
