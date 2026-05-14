import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AuthProvider } from '@/lib/context/AuthContext'
import { ProjectsProvider } from '@/lib/context/ProjectsContext'
import { TasksProvider } from '@/lib/context/TasksContext'
import { UIProvider } from '@/lib/context/UIContext'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Topbar } from '@/components/layout/Topbar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <AuthProvider>
      <ProjectsProvider>
        <TasksProvider>
          <UIProvider>
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                <Topbar />
                <main
                  className="flex-1 overflow-auto"
                  style={{ background: 'var(--bg)' }}
                >
                  {children}
                </main>
              </div>
            </div>
            <BottomNav />
          </UIProvider>
        </TasksProvider>
      </ProjectsProvider>
    </AuthProvider>
  )
}
