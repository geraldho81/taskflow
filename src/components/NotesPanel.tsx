'use client'

import { useState, useRef } from 'react'
import { Note, NoteColor, NOTE_COLORS } from '@/types/database'

interface NotesPanelProps {
  notes: Note[]
  onCreate: () => void
  onUpdate: (id: string, data: { content?: string; color?: NoteColor }) => void
  onDelete: (id: string) => void
}

function getRotation(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return (Math.abs(hash) % 5) - 2 // -2 to 2 degrees
}

function StickyNote({
  note,
  onUpdate,
  onDelete,
}: {
  note: Note
  onUpdate: (id: string, data: { content?: string; color?: NoteColor }) => void
  onDelete: (id: string) => void
}) {
  const [localContent, setLocalContent] = useState(note.content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const rotation = getRotation(note.id)
  const colors = NOTE_COLORS[note.color] || NOTE_COLORS.yellow

  const handleBlur = () => {
    if (localContent !== note.content) {
      onUpdate(note.id, { content: localContent })
    }
  }

  return (
    <div
      className="sticky-note group rounded-lg p-4 pb-3 mb-3"
      style={{
        backgroundColor: colors.bg,
        boxShadow: `0 2px 8px ${colors.shadow}, 0 1px 3px rgba(0,0,0,0.08)`,
        transform: `rotate(${rotation}deg)`,
      }}
    >
      {/* Delete button */}
      <button
        onClick={() => onDelete(note.id)}
        className="absolute top-1.5 right-6 opacity-0 group-hover:opacity-100 transition-opacity text-black/30 hover:text-black/60 text-sm leading-none cursor-pointer"
        aria-label="Delete note"
      >
        &times;
      </button>

      {/* Content */}
      <textarea
        ref={textareaRef}
        value={localContent}
        onChange={(e) => setLocalContent(e.target.value)}
        onBlur={handleBlur}
        placeholder="Write something..."
        rows={3}
        className="sticky-note-textarea"
      />

      {/* Color picker */}
      <div className="flex gap-1.5 mt-2">
        {(Object.keys(NOTE_COLORS) as NoteColor[]).map((color) => (
          <button
            key={color}
            onClick={() => onUpdate(note.id, { color })}
            className="w-4 h-4 rounded-full cursor-pointer transition-transform hover:scale-125"
            style={{
              backgroundColor: NOTE_COLORS[color].bg,
              border: note.color === color ? '2px solid rgba(0,0,0,0.3)' : '1px solid rgba(0,0,0,0.1)',
            }}
            aria-label={`Change to ${color}`}
          />
        ))}
      </div>
    </div>
  )
}

export default function NotesPanel({ notes, onCreate, onUpdate, onDelete }: NotesPanelProps) {
  return (
    <aside className="w-[280px] flex-shrink-0 hidden lg:block">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h2
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-secondary)' }}
        >
          Notes
        </h2>
        <button
          onClick={onCreate}
          className="w-6 h-6 flex items-center justify-center rounded text-sm cursor-pointer transition-colors"
          style={{
            color: 'var(--text-secondary)',
            background: 'var(--bg-secondary)',
          }}
          aria-label="Add note"
        >
          +
        </button>
      </div>

      {/* Notes list */}
      <div
        className="overflow-y-auto pr-1"
        style={{ maxHeight: 'calc(100vh - 160px)' }}
      >
        {notes.length === 0 ? (
          <p
            className="text-center text-xs py-8"
            style={{ color: 'var(--text-tertiary)' }}
          >
            No notes yet. Click + to add one.
          </p>
        ) : (
          notes.map((note) => (
            <StickyNote
              key={note.id}
              note={note}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </aside>
  )
}
