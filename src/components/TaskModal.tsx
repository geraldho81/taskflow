'use client'

import { useState, useEffect } from 'react'
import { Task, SubTask, TAG_CONFIG, PRESET_TAGS, PresetTagType, getTagInfo } from '@/types/database'

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
}

export default function TaskModal({ isOpen, onClose, onSubmit, task }: TaskModalProps) {
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

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ background: 'rgba(0, 0, 0, 0.4)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl animate-fadeIn"
        style={{
          background: 'var(--bg-card)',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--border-light)' }}
        >
          <h2
            className="text-lg font-semibold"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
            }}
          >
            {task ? 'Edit Task' : 'New Task'}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label
              className="block text-[13px] font-medium mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Title <span style={{ color: 'var(--tag-orange-text)' }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="Enter task title"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label
              className="block text-[13px] font-medium mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input resize-none"
              placeholder="Add a description..."
              rows={3}
            />
          </div>

          {/* Deadline */}
          <div>
            <label
              className="block text-[13px] font-medium mb-1.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Deadline
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="input"
            />
          </div>

          {/* Tags */}
          <div>
            <label
              className="block text-[13px] font-medium mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              Tags
            </label>

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
          </div>

          {/* Subtasks */}
          <div>
            <label
              className="block text-[13px] font-medium mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              Sub tasks
            </label>

            {/* Existing subtasks */}
            {subtasks.length > 0 && (
              <div className="space-y-2 mb-3">
                {subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-2 p-2 rounded-lg"
                    style={{ background: 'var(--bg-secondary)' }}
                  >
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => toggleSubtask(subtask.id)}
                      className="checkbox-custom"
                    />
                    <span
                      className={`flex-1 text-[13px] ${
                        subtask.completed ? 'line-through' : ''
                      }`}
                      style={{
                        color: subtask.completed
                          ? 'var(--text-tertiary)'
                          : 'var(--text-primary)',
                      }}
                    >
                      {subtask.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSubtask(subtask.id)}
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
                ))}
              </div>
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
          </div>

          {/* Actions */}
          <div
            className="flex justify-end gap-3 pt-4 border-t"
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
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ background: 'var(--accent)' }}
            >
              {task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
