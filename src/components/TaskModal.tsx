'use client'

import { useState, useEffect } from 'react'
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Task, SubTask, TAG_CONFIG, PRESET_TAGS, PresetTagType, getTagInfo } from '@/types/database'

// Sortable subtask item component
function SortableSubtaskItem({
  subtask,
  onToggle,
  onRemove,
  onUpdate,
}: {
  subtask: SubTask
  onToggle: () => void
  onRemove: () => void
  onUpdate: (text: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(subtask.text)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subtask.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleSave = () => {
    const trimmed = editText.trim()
    if (trimmed && trimmed !== subtask.text) {
      onUpdate(trimmed)
    } else {
      setEditText(subtask.text)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      setEditText(subtask.text)
      setIsEditing(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 rounded-lg"
      {...attributes}
    >
      <div
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-[var(--bg-hover)]"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </div>
      <input
        type="checkbox"
        checked={subtask.completed}
        onChange={onToggle}
        className="checkbox-custom"
      />
      {isEditing ? (
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="flex-1 text-[13px] px-2 py-1 rounded border outline-none"
          style={{
            background: 'var(--bg-primary)',
            borderColor: 'var(--accent)',
            color: 'var(--text-primary)',
          }}
          autoFocus
        />
      ) : (
        <span
          onClick={() => setIsEditing(true)}
          className={`flex-1 text-[13px] cursor-text px-2 py-1 rounded hover:bg-[var(--bg-hover)] ${subtask.completed ? 'line-through' : ''}`}
          style={{
            color: subtask.completed ? 'var(--text-tertiary)' : 'var(--text-primary)',
          }}
        >
          {subtask.text}
        </span>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="p-1 rounded transition-colors"
        style={{ color: 'var(--text-tertiary)' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--tag-orange-text)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    title: string
    description?: string
    deadline?: string
    tags?: string[]
    subtasks?: SubTask[]
  }) => void
  task?: Task | null
  viewOnly?: boolean
  onEdit?: () => void
  onToggleSubtask?: (subtaskId: string) => void
}

export default function TaskModal({ isOpen, onClose, onSubmit, task, viewOnly = false, onEdit, onToggleSubtask }: TaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [subtasks, setSubtasks] = useState<SubTask[]>([])
  const [newSubtask, setNewSubtask] = useState('')
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setDeadline(task.deadline || '')
      setTags((task.tags || []) as string[])
      setSubtasks((task.subtasks || []) as SubTask[])
    } else {
      setTitle('')
      setDescription('')
      setDeadline('')
      setTags([])
      setSubtasks([])
    }
    setNewSubtask('')
    setNewTag('')
  }, [task, isOpen])

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      deadline: deadline || undefined,
      tags: tags.length > 0 ? tags : undefined,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
    })
  }

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const addCustomTag = () => {
    const tagValue = newTag.trim().toLowerCase().replace(/\s+/g, '-')
    if (!tagValue || tags.includes(tagValue)) return
    setTags((prev) => [...prev, tagValue])
    setNewTag('')
  }

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  // Get custom tags (non-preset)
  const customTags = tags.filter((tag) => !PRESET_TAGS.includes(tag as PresetTagType))

  const addSubtask = () => {
    if (!newSubtask.trim()) return
    setSubtasks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: newSubtask.trim(), completed: false },
    ])
    setNewSubtask('')
  }

  const removeSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((st) => st.id !== id))
  }

  const toggleSubtask = (id: string) => {
    setSubtasks((prev) =>
      prev.map((st) => (st.id === id ? { ...st, completed: !st.completed } : st))
    )
  }

  const updateSubtask = (id: string, text: string) => {
    setSubtasks((prev) =>
      prev.map((st) => (st.id === id ? { ...st, text } : st))
    )
  }

  const handleSubtaskDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setSubtasks((prev) => {
      const oldIndex = prev.findIndex((st) => st.id === active.id)
      const newIndex = prev.findIndex((st) => st.id === over.id)
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ background: 'rgba(0, 0, 0, 0.4)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl animate-fadeIn flex flex-col"
        style={{
          background: 'var(--bg-card)',
          boxShadow: 'var(--shadow-lg)',
          maxHeight: 'calc(100vh - 2rem)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border-light)' }}
        >
          <h2
            className="text-lg font-semibold"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
            }}
          >
            {viewOnly ? 'Task Details' : task ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Title */}
          <div>
            <label
              className="block text-[13px] font-medium mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Title {!viewOnly && <span style={{ color: 'var(--tag-orange-text)' }}>*</span>}
            </label>
            {viewOnly ? (
              <p className="text-[15px] font-medium" style={{ color: 'var(--text-primary)' }}>
                {title}
              </p>
            ) : (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                placeholder="Enter task title"
                required
                autoFocus
              />
            )}
          </div>

          {/* Description */}
          <div>
            <label
              className="block text-[13px] font-medium mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Description
            </label>
            {viewOnly ? (
              <p className="text-[14px]" style={{ color: description ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                {description || 'No description'}
              </p>
            ) : (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input resize-none"
                placeholder="Add a description..."
                rows={3}
              />
            )}
          </div>

          {/* Deadline */}
          <div>
            <label
              className="block text-[13px] font-medium mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Deadline
            </label>
            {viewOnly ? (
              <p className="text-[14px]" style={{ color: deadline ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                {deadline ? new Date(deadline).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'No deadline set'}
              </p>
            ) : (
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="input"
              />
            )}
          </div>

          {/* Tags */}
          <div>
            <label
              className="block text-[13px] font-medium mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              Tags
            </label>

            {viewOnly ? (
              tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
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
                </div>
              ) : (
                <p className="text-[14px]" style={{ color: 'var(--text-tertiary)' }}>No tags</p>
              )
            ) : (
              <>
                {/* Preset tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {PRESET_TAGS.map((tag) => {
                    const config = TAG_CONFIG[tag]
                    const isSelected = tags.includes(tag)
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`tag transition-all ${config.className}`}
                        style={{
                          opacity: isSelected ? 1 : 0.5,
                          transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                          border: isSelected ? '1px solid currentColor' : '1px solid transparent',
                        }}
                      >
                        {config.label}
                      </button>
                    )
                  })}
                </div>

                {/* Custom tags */}
                {customTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {customTags.map((tag) => {
                      const tagInfo = getTagInfo(tag)
                      return (
                        <span
                          key={tag}
                          className="tag inline-flex items-center gap-1"
                          style={{ background: tagInfo.bg, color: tagInfo.text }}
                        >
                          {tagInfo.label}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-0.5 hover:opacity-70 transition-opacity"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      )
                    })}
                  </div>
                )}

                {/* Add custom tag input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addCustomTag()
                      }
                    }}
                    className="input flex-1"
                    placeholder="Add a custom tag..."
                  />
                  <button
                    type="button"
                    onClick={addCustomTag}
                    className="btn btn-secondary"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-light)',
                    }}
                  >
                    Add
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Subtasks */}
          <div>
            <label
              className="block text-[13px] font-medium mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              Sub tasks
            </label>

            {viewOnly ? (
              subtasks.length > 0 ? (
                <div className="space-y-2">
                  {subtasks.map((subtask) => (
                    <label
                      key={subtask.id}
                      className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors"
                      style={{ background: 'var(--bg-secondary)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                    >
                      <input
                        type="checkbox"
                        checked={subtask.completed}
                        onChange={() => onToggleSubtask?.(subtask.id)}
                        className="checkbox-custom"
                      />
                      <span
                        className={`flex-1 text-[13px] ${subtask.completed ? 'line-through' : ''}`}
                        style={{
                          color: subtask.completed ? 'var(--text-tertiary)' : 'var(--text-primary)',
                        }}
                      >
                        {subtask.text}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-[14px]" style={{ color: 'var(--text-tertiary)' }}>No subtasks</p>
              )
            ) : (
              <>
                {/* Existing subtasks with drag and drop */}
                {subtasks.length > 0 && (
                  <DndContext
                    collisionDetection={closestCenter}
                    onDragEnd={handleSubtaskDragEnd}
                  >
                    <SortableContext
                      items={subtasks.map((st) => st.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2 mb-3">
                        {subtasks.map((subtask) => (
                          <div key={subtask.id} style={{ background: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
                            <SortableSubtaskItem
                              subtask={subtask}
                              onToggle={() => toggleSubtask(subtask.id)}
                              onRemove={() => removeSubtask(subtask.id)}
                              onUpdate={(text) => updateSubtask(subtask.id, text)}
                            />
                          </div>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}

                {/* Add subtask input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addSubtask()
                      }
                    }}
                    className="input flex-1"
                    placeholder="Add a subtask..."
                  />
                  <button
                    type="button"
                    onClick={addSubtask}
                    className="btn btn-secondary"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-light)',
                    }}
                  >
                    Add
                  </button>
                </div>
              </>
            )}
          </div>

          </div>
          {/* Actions - fixed at bottom */}
          <div
            className="flex justify-end gap-3 px-6 py-4 border-t flex-shrink-0"
            style={{ borderColor: 'var(--border-light)' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
                color: 'var(--text-secondary)',
              }}
            >
              {viewOnly ? 'Close' : 'Cancel'}
            </button>
            {viewOnly ? (
              onEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onEdit()
                  }}
                  className="btn btn-primary"
                  style={{ background: 'var(--accent)' }}
                >
                  Edit Task
                </button>
              )
            ) : (
              <button
                type="submit"
                className="btn btn-primary"
                style={{ background: 'var(--accent)' }}
              >
                {task ? 'Save Changes' : 'Create Task'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
