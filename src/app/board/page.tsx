import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import KanbanBoard from '@/components/KanbanBoard'

export default async function BoardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [{ data: tasks }, { data: notes }] = await Promise.all([
    supabase
      .from('tasks')
      .select('*')
      .order('position', { ascending: true }),
    supabase
      .from('notes')
      .select('*')
      .order('position', { ascending: true }),
  ])

  return <KanbanBoard initialTasks={tasks || []} initialNotes={notes || []} userEmail={user.email || ''} />
}
