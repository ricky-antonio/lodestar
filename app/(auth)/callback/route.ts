import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/dashboard'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  if (!code) {
    return NextResponse.redirect(`${siteUrl}/login`)
  }

  const supabase = await createClient()

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !data.user) {
      return NextResponse.redirect(`${siteUrl}/login`)
    }

    const user = data.user

    // For non-dashboard destinations (e.g. password reset), skip workspace creation
    if (next !== '/dashboard') {
      return NextResponse.redirect(`${siteUrl}${next}`)
    }

    // Check whether this user already has a workspace
    const { data: existingMember } = await supabase
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

      const { data: workspace, error: wsError } = await supabase
        .from('workspaces')
        .insert({ name: baseName, slug, owner_id: user.id })
        .select('id')
        .single()

      if (wsError || !workspace) {
        return NextResponse.redirect(`${siteUrl}/login`)
      }

      await supabase.from('workspace_members').insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'owner',
      })
    }

    return NextResponse.redirect(`${siteUrl}/dashboard`)
  } catch {
    return NextResponse.redirect(`${siteUrl}/login`)
  }
}
