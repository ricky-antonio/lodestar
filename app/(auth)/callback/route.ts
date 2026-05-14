import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createRouteHandlerClient } from '@/lib/supabase/route-handler'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/dashboard'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  if (!code) {
    return NextResponse.redirect(`${siteUrl}/login`)
  }

  // Create the redirect response first so exchangeCodeForSession can write
  // session cookies directly onto it via the cookie handlers in the client.
  const destination = next !== '/dashboard' ? `${siteUrl}${next}` : `${siteUrl}/dashboard`
  const response = NextResponse.redirect(destination)
  const supabase = createRouteHandlerClient(request, response)

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !data.user) {
      return NextResponse.redirect(`${siteUrl}/login`)
    }

    const user = data.user

    if (next !== '/dashboard') {
      return response
    }

    // Use service role client for workspace bootstrapping — the anon client's
    // RLS policies are self-referential and block inserts for brand-new users
    // who have no workspace memberships yet.
    const admin = createAdminClient()

    const { data: existingMember } = await admin
      .from('workspace_members')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (!existingMember) {
      const baseName = user.user_metadata?.full_name
        ? `${user.user_metadata.full_name}'s workspace`
        : user.email
          ? `${user.email.split('@')[0]}'s workspace`
          : 'My workspace'

      const slug =
        baseName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') +
        '-' +
        Math.random().toString(36).slice(2, 7)

      const { data: workspace, error: wsError } = await admin
        .from('workspaces')
        .insert({ name: baseName, slug, owner_id: user.id })
        .select('id')
        .single()

      if (wsError || !workspace) {
        return NextResponse.redirect(`${siteUrl}/login`)
      }

      await admin.from('workspace_members').insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'owner',
      })
    }

    return response
  } catch {
    return NextResponse.redirect(`${siteUrl}/login`)
  }
}
