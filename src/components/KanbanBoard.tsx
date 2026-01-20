'use client'

import { useState, useMemo, useEffect } from 'react'
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, DragOverlay, pointerWithin } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Task, TaskStatus, SubTask, getTagInfo } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import Column from './Column'
import TaskCard from './TaskCard'
import TaskModal from './TaskModal'
import ConfirmModal from './ConfirmModal'
import Header from './Header'

interface KanbanBoardProps {
  initialTasks: Task[]
  userEmail: string
}

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'queue', title: 'TO DO' },
  { id: 'in_progress', title: 'DOING' },
  { id: 'completed', title: 'DONE' },
]

export default function KanbanBoard({ initialTasks, userEmail }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [viewingTask, setViewingTask] = useState<Task | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; task: Task | null }>({
    isOpen: false,
    task: null,
  })
  const [isMounted, setIsMounted] = useState(false)

  // Prevent hydration mismatch from dnd-kit
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks
    const query = searchQuery.toLowerCase()
    return tasks.filter((task) => {
      // Search in title
      if (task.title.toLowerCase().includes(query)) return true
      // Search in description
      if (task.description && task.description.toLowerCase().includes(query)) return true
      // Search in tags (both the tag ID and display label)
      if (task.tags && task.tags.some((tag) => {
        const tagInfo = getTagInfo(tag)
        return tag.toLowerCase().includes(query) || tagInfo.label.toLowerCase().includes(query)
      })) return true
      // Search in subtasks
      if (task.subtasks && (task.subtasks as SubTask[]).some((subtask) =>
        subtask.text.toLowerCase().includes(query)
      )) return true
      return false
    })
  }, [tasks, searchQuery])

  const getTasksByStatus = (status: TaskStatus) => {
    return filteredTasks
      .filter((task) => task.status === status)
      .sort((a, b) => a.position - b.position)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTask = tasks.find((t) => t.id === activeId)
    if (!activeTask) return

    const overColumn = COLUMNS.find((c) => c.id === overId)
    if (overColumn && activeTask.status !== overColumn.id) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, status: overColumn.id } : t
        )
      )
      return
    }

    const overTask = tasks.find((t) => t.id === overId)
    if (overTask && activeTask.status !== overTask.status) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === activeId ? { ...t, status: overTask.status } : t
        )
      )
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    const activeTask = tasks.find((t) => t.id === activeId)
    if (!activeTask) return

    // Store original tasks state for rollback on error
    const originalTasks = [...tasks]

    // Determine target status
    let targetStatus: TaskStatus = activeTask.status
    const overColumn = COLUMNS.find((c) => c.id === overId)
    const overTask = tasks.find((t) => t.id === overId)

    if (overColumn) {
      targetStatus = overColumn.id
    } else if (overTask) {
      targetStatus = overTask.status
    }

    const supabase = createClient()

    // Get tasks in target column (sorted by position)
    const tasksInTargetColumn = tasks
      .filter((t) => t.status === targetStatus)
      .sort((a, b) => a.position - b.position)

    // Same column reordering
    if (activeTask.status === targetStatus) {
      const oldIndex = tasksInTargetColumn.findIndex((t) => t.id === activeId)
      const newIndex = overTask
        ? tasksInTargetColumn.findIndex((t) => t.id === overId)
        : tasksInTargetColumn.length - 1

      if (oldIndex !== newIndex && newIndex !== -1) {
        const reorderedTasks = arrayMove(tasksInTargetColumn, oldIndex, newIndex)

        // Update positions for all tasks in the column
        const updatedTasks = reorderedTasks.map((t, index) => ({
          ...t,
          position: index,
        }))

        setTasks((prev) =>
          prev.map((t) => {
            const updated = updatedTasks.find((ut) => ut.id === t.id)
            return updated || t
          })
        )

        // Batch update positions in database with error handling
        try {
          for (const t of updatedTasks) {
            const { data, error } = await supabase
              .from('tasks')
              .update({ position: t.position })
              .eq('id', t.id)
              .select()
            if (error) throw error
            if (!data || data.length === 0) {
              throw new Error('Update failed - no rows affected (possible RLS issue)')
            }
          }
        } catch (error) {
          console.error('Failed to update task positions:', error)
          setTasks(originalTasks)
        }
      }
    } else {
      // Moving to different column
      // Remove from old column and add to new column
      const tasksInOldColumn = tasks
        .filter((t) => t.status === activeTask.status && t.id !== activeId)
        .sort((a, b) => a.position - b.position)

      // Calculate new position in target column
      let newPosition: number
      if (overColumn) {
        // Dropped on column itself - add to end
        newPosition = tasksInTargetColumn.length
      } else if (overTask) {
        // Dropped on a task - insert at that position
        const overIndex = tasksInTargetColumn.findIndex((t) => t.id === overId)
        newPosition = overIndex >= 0 ? overIndex : tasksInTargetColumn.length
      } else {
        newPosition = tasksInTargetColumn.length
      }

      // Update positions in old column
      const updatedOldColumn = tasksInOldColumn.map((t, index) => ({
        ...t,
        position: index,
      }))

      // Insert into new column and update positions
      const newColumnTasks = [
        ...tasksInTargetColumn.slice(0, newPosition),
        { ...activeTask, status: targetStatus, position: newPosition },
        ...tasksInTargetColumn.slice(newPosition),
      ].map((t, index) => ({ ...t, position: index }))

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === activeId) {
            return { ...t, status: targetStatus, position: newPosition }
          }
          const updatedOld = updatedOldColumn.find((ut) => ut.id === t.id)
          if (updatedOld) return updatedOld
          const updatedNew = newColumnTasks.find((ut) => ut.id === t.id)
          if (updatedNew) return updatedNew
          return t
        })
      )

      // Update database with error handling
      try {
        // Update the moved task's status and position
        const { data: updatedData, error: statusError } = await supabase
          .from('tasks')
          .update({ status: targetStatus, position: newPosition })
          .eq('id', activeId)
          .select()
        if (statusError) throw statusError
        if (!updatedData || updatedData.length === 0) {
          throw new Error('Update failed - no rows affected (possible RLS issue)')
        }

        // Update positions for remaining tasks in old column
        for (const t of updatedOldColumn) {
          const { error } = await supabase
            .from('tasks')
            .update({ position: t.position })
            .eq('id', t.id)
          if (error) throw error
        }

        // Update positions for tasks in new column
        for (const t of newColumnTasks) {
          if (t.id !== activeId) {
            const { error } = await supabase
              .from('tasks')
              .update({ position: t.position })
              .eq('id', t.id)
            if (error) throw error
          }
        }
      } catch (error) {
        console.error('Failed to update task status:', error)
        setTasks(originalTasks)
      }
    }
  }

  const handleCreateTask = async (data: {
    title: string
    description?: string
    deadline?: string
    tags?: string[]
    subtasks?: SubTask[]
  }) => {
    const supabase = createClient()
    const queueTasks = tasks.filter((t) => t.status === 'queue')
    const maxPosition = queueTasks.length > 0
      ? Math.max(...queueTasks.map((t) => t.position))
      : -1

    const { data: newTask, error } = await supabase
      .from('tasks')
      .insert({
        title: data.title,
        description: data.description || null,
        deadline: data.deadline || null,
        tags: data.tags || [],
        subtasks: data.subtasks || [],
        attachments: [],
        status: 'queue' as TaskStatus,
        position: maxPosition + 1,
        user_id: (await supabase.auth.getUser()).data.user!.id,
      })
      .select()
      .single()

    if (!error && newTask) {
      setTasks((prev) => [...prev, newTask])
    }
    setModalOpen(false)
  }

  const handleUpdateTask = async (data: {
    title: string
    description?: string
    deadline?: string
    tags?: string[]
    subtasks?: SubTask[]
  }) => {
    if (!editingTask) return

    const supabase = createClient()
    const { error } = await supabase
      .from('tasks')
      .update({
        title: data.title,
        description: data.description || null,
        deadline: data.deadline || null,
        tags: data.tags || [],
        subtasks: data.subtasks || [],
      })
      .eq('id', editingTask.id)

    if (!error) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                title: data.title,
                description: data.description || null,
                deadline: data.deadline || null,
                tags: data.tags || [],
                subtasks: data.subtasks || [],
              }
            : t
        )
      )
    }
    setEditingTask(null)
    setModalOpen(false)
  }

  const handleDeleteTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (task) {
      setDeleteConfirm({ isOpen: true, task })
    }
  }

  const confirmDeleteTask = async () => {
    if (!deleteConfirm.task) return

    const supabase = createClient()
    const { error } = await supabase.from('tasks').delete().eq('id', deleteConfirm.task.id)
    if (!error) {
      setTasks((prev) => prev.filter((t) => t.id !== deleteConfirm.task!.id))
    }
    setDeleteConfirm({ isOpen: false, task: null })
  }

  const handleViewTask = (task: Task) => {
    setViewingTask(task)
    setModalOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setViewingTask(null)
    setModalOpen(true)
  }

  const handleSwitchToEdit = () => {
    if (viewingTask) {
      setEditingTask(viewingTask)
      setViewingTask(null)
    }
  }

  const handleViewToggleSubtask = async (subtaskId: string) => {
    if (!viewingTask) return

    const subtasks = (viewingTask.subtasks || []) as SubTask[]
    const updatedSubtasks = subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    )

    const updatedTask = { ...viewingTask, subtasks: updatedSubtasks }

    // Update viewingTask state for immediate UI feedback
    setViewingTask(updatedTask)

    // Update tasks state
    setTasks((prev) =>
      prev.map((t) =>
        t.id === viewingTask.id ? { ...t, subtasks: updatedSubtasks } : t
      )
    )

    // Save to database
    const supabase = createClient()
    await supabase
      .from('tasks')
      .update({ subtasks: updatedSubtasks })
      .eq('id', viewingTask.id)
  }

  const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    const subtasks = (task.subtasks || []) as SubTask[]
    const updatedSubtasks = subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    )

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, subtasks: updatedSubtasks } : t
      )
    )

    const supabase = createClient()
    await supabase
      .from('tasks')
      .update({ subtasks: updatedSubtasks })
      .eq('id', taskId)
  }

  const handleExport = (format: 'json' | 'csv') => {
    const data = tasks.map(({ id, title, description, deadline, status, tags, subtasks, completed_at, created_at }) => ({
      id,
      title,
      description: description || '',
      deadline: deadline || '',
      status,
      tags: (tags || []).join(', '),
      subtasks: (subtasks || []).map((st: SubTask) => `${st.completed ? '[x]' : '[ ]'} ${st.text}`).join('; '),
      completed_at: completed_at || '',
      created_at,
    }))

    let content: string
    let filename: string
    let type: string

    if (format === 'json') {
      content = JSON.stringify(data, null, 2)
      filename = 'taskflow-export.json'
      type = 'application/json'
    } else {
      const headers = ['id', 'title', 'description', 'deadline', 'status', 'tags', 'subtasks', 'completed_at', 'created_at']
      const csvRows = [
        headers.join(','),
        ...data.map((row) =>
          headers.map((h) => {
            const value = row[h as keyof typeof row]
            const escaped = String(value).replace(/"/g, '""')
            return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')
              ? `"${escaped}"`
              : escaped
          }).join(',')
        ),
      ]
      content = csvRows.join('\n')
      filename = 'taskflow-export.csv'
      type = 'text/csv'
    }

    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Header
        userEmail={userEmail}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onExport={handleExport}
        onNewTask={() => {
          setEditingTask(null)
          setViewingTask(null)
          setModalOpen(true)
        }}
      />

      <main className="px-6 py-6">
        {isMounted ? (
          <DndContext
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-6 overflow-x-auto pb-4">
              {COLUMNS.map((column) => (
                <Column
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  tasks={getTasksByStatus(column.id)}
                  onViewTask={handleViewTask}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  onToggleSubtask={handleToggleSubtask}
                />
              ))}
            </div>

            <DragOverlay>
              {activeTask ? (
                <TaskCard
                  task={activeTask}
                  onView={() => {}}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onToggleSubtask={() => {}}
                  isDragging
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-4">
            {COLUMNS.map((column) => (
              <Column
                key={column.id}
                id={column.id}
                title={column.title}
                tasks={getTasksByStatus(column.id)}
                onViewTask={handleViewTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onToggleSubtask={handleToggleSubtask}
              />
            ))}
          </div>
        )}
      </main>

      <TaskModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingTask(null)
          setViewingTask(null)
        }}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        task={viewingTask || editingTask}
        viewOnly={!!viewingTask}
        onEdit={handleSwitchToEdit}
        onToggleSubtask={handleViewToggleSubtask}
      />

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Task"
        message={`Are you sure you want to delete "${deleteConfirm.task?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDeleteTask}
        onCancel={() => setDeleteConfirm({ isOpen: false, task: null })}
      />
    </div>
  )
}
