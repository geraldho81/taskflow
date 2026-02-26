'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Task, SubTask, getTagInfo, isPresetTag } from '@/types/database'

interface TaskCardProps {
  task: Task
  onView: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleSubtask: (subtaskId: string) => void
  isDragging?: boolean
}

function getDeadlineStatus(deadline: string | null): 'overdue' | 'today' | 'future' | null {
  if (!deadline) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const deadlineDate = new Date(deadline)
  deadlineDate.setHours(0, 0, 0, 0)

  const diffTime = deadlineDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'overdue'
  if (diffDays === 0) return 'today'
  return 'future'
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function TaskCard({
  task,
  onView,
  onEdit,
  onDelete,
  onToggleSubtask,
  isDragging,
}: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const deadlineStatus = task.status !== 'completed' ? getDeadlineStatus(task.deadline) : null
  const subtasks = (task.subtasks || []) as SubTask[]
  const tags = (task.tags || []) as string[]
  const completedSubtasks = subtasks.filter((st) => st.completed).length

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card p-4 group cursor-pointer ${
        isDragging || isSortableDragging ? 'opacity-60 rotate-2 scale-105' : ''
      }`}
      onClick={onView}
    >
      {/* Header with drag handle, title and actions */}
      <div className="flex items-start gap-2">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 -ml-1 mt-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="9" cy="6" r="1.5" />
            <circle cx="15" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" />
            <circle cx="15" cy="18" r="1.5" />
          </svg>
        </div>

        <h3
          className="font-medium text-[15px] leading-snug flex-1"
          style={{ color: 'var(--text-primary)' }}
        >
          {task.title}
        </h3>

        {/* Action buttons */}
        <div className="flex gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onEdit()
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-tertiary)'
            }}
            title="Edit task"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDelete()
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--tag-orange)'
              e.currentTarget.style.color = 'var(--tag-orange-text)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-tertiary)'
            }}
            title="Delete task"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p
          className="text-[13px] mt-2 ml-6 line-clamp-2 leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          {task.description}
        </p>
      )}

      {/* Subtasks */}
      {subtasks.length > 0 && (
        <div className="mt-3 ml-6 space-y-1.5">
          <p
            className="text-[11px] font-medium uppercase tracking-wide"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Sub tasks
          </p>
          {subtasks.slice(0, 3).map((subtask) => (
            <label
              key={subtask.id}
              className="flex items-center gap-2 cursor-pointer group/subtask"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={subtask.completed}
                onChange={() => onToggleSubtask(subtask.id)}
                className="checkbox-custom"
              />
              <span
                className={`text-[13px] transition-colors ${
                  subtask.completed ? 'line-through' : ''
                }`}
                style={{
                  color: subtask.completed ? 'var(--text-tertiary)' : 'var(--text-secondary)'
                }}
              >
                {subtask.text}
              </span>
            </label>
          ))}
          {subtasks.length > 3 && (
            <p
              className="text-[12px] pl-6"
              style={{ color: 'var(--text-tertiary)' }}
            >
              +{subtasks.length - 3} more
            </p>
          )}
        </div>
      )}

      {/* Footer: Tags, deadline, attachments */}
      {(tags.length > 0 || task.deadline || subtasks.length > 0) && (
        <div className="flex items-center flex-wrap gap-2 mt-3 ml-6 pt-3" style={{ borderTop: '1px solid var(--border-light)' }}>
          {/* Tags */}
          {tags.map((tag) => {
            const tagInfo = getTagInfo(tag)
            return (
              <span
                key={tag}
                className={`tag ${tagInfo.className || ''}`}
                style={!tagInfo.className ? { background: tagInfo.bg, color: tagInfo.text } : undefined}
              >
                {tagInfo.label}
              </span>
            )
          })}

          {/* Deadline */}
          {task.deadline && deadlineStatus && (
            <span
              className="tag"
              style={{
                background:
                  deadlineStatus === 'overdue'
                    ? 'var(--tag-orange)'
                    : deadlineStatus === 'today'
                    ? 'var(--tag-orange)'
                    : 'var(--bg-secondary)',
                color:
                  deadlineStatus === 'overdue'
                    ? 'var(--tag-orange-text)'
                    : deadlineStatus === 'today'
                    ? 'var(--tag-orange-text)'
                    : 'var(--text-tertiary)',
              }}
            >
              {deadlineStatus === 'overdue' && 'Overdue · '}
              {deadlineStatus === 'today' && 'Today · '}
              {formatDate(task.deadline)}
            </span>
          )}

          {/* Completed timestamp */}
          {task.status === 'completed' && task.completed_at && (
            <span
              className="tag"
              style={{
                background: 'var(--tag-green)',
                color: 'var(--tag-green-text)',
              }}
            >
              Done {formatDate(task.completed_at)}
            </span>
          )}

          {/* Subtask progress */}
          {subtasks.length > 0 && (
            <span
              className="tag ml-auto"
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-tertiary)',
              }}
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {completedSubtasks}/{subtasks.length}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
