import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AuthProvider } from '@/lib/context/AuthContext'
import { ProjectsProvider } from '@/lib/context/ProjectsContext'
import { TasksProvider } from '@/lib/context/TasksContext'
import { UIProvider } from '@/lib/context/UIContext'
import { AppShell } from '@/components/layout/AppShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <AuthProvider>
      <ProjectsProvider>
        <TasksProvider>
          <UIProvider>
            <AppShell>
              {children}
            </AppShell>
          </UIProvider>
        </TasksProvider>
      </ProjectsProvider>
    </AuthProvider>
  )
}
