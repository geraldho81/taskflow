'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Task, TaskStatus } from '@/types/database'
import TaskCard from './TaskCard'

interface ColumnProps {
  id: TaskStatus
  title: string
  tasks: Task[]
  onEditTask: (task: Task) => void
  onDeleteTask: (taskId: string) => void
  onToggleSubtask: (taskId: string, subtaskId: string) => void
}

const COLUMN_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  queue: { label: 'TO DO', color: 'var(--text-secondary)' },
  in_progress: { label: 'DOING', color: 'var(--tag-blue-text)' },
  completed: { label: 'DONE', color: 'var(--tag-green-text)' },
}

export default function Column({
  id,
  title,
  tasks,
  onEditTask,
  onDeleteTask,
  onToggleSubtask,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const config = COLUMN_CONFIG[id]

  return (
    <div
      ref={setNodeRef}
      className="flex-1 min-w-[320px] max-w-[400px] flex flex-col"
      style={{
        minHeight: 'calc(100vh - 140px)'
      }}
    >
      {/* Column Header */}
      <div className="flex items-center gap-2 mb-4 px-1">
        <h2
          className="text-xs font-semibold tracking-wide"
          style={{
            color: config.color,
            letterSpacing: '0.05em'
          }}
        >
          {config.label}
        </h2>
        <span
          className="text-xs font-medium px-1.5 py-0.5 rounded"
          style={{
            background: 'var(--bg-secondary)',
            color: 'var(--text-tertiary)'
          }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Drop Zone */}
      <div
        className="flex-1 rounded-lg p-2 transition-all duration-200"
        style={{
          background: isOver ? 'var(--bg-hover)' : 'transparent',
          border: isOver ? '2px dashed var(--border-medium)' : '2px dashed transparent'
        }}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {tasks.map((task, index) => (
              <div
                key={task.id}
                className="animate-fadeIn"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <TaskCard
                  task={task}
                  onEdit={() => onEditTask(task)}
                  onDelete={() => onDeleteTask(task.id)}
                  onToggleSubtask={(subtaskId) => onToggleSubtask(task.id, subtaskId)}
                />
              </div>
            ))}
          </div>
        </SortableContext>

        {tasks.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-12 px-4 rounded-lg"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px dashed var(--border-light)'
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
              style={{ background: 'var(--bg-hover)' }}
            >
              <svg
                className="w-5 h-5"
                style={{ color: 'var(--text-tertiary)' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p
              className="text-sm text-center"
              style={{ color: 'var(--text-tertiary)' }}
            >
              No tasks yet
            </p>
            <p
              className="text-xs text-center mt-1"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Drag tasks here or create a new one
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
