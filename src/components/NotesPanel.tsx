'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Note } from '@/types/database'

const NOTE_BG = '#FFF9C4'
const NOTE_SHADOW = 'rgba(255, 235, 59, 0.3)'

interface NotesPanelProps {
  notes: Note[]
  onCreate: () => void
  onUpdate: (id: string, data: { content?: string }) => void
  onDelete: (id: string) => void
  onReorder: (activeId: string, overId: string) => void
}

function getRotation(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return (Math.abs(hash) % 5) - 2 // -2 to 2 degrees
}

function useAutoResize(content: string) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const resize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [])

  useEffect(() => {
    resize()
  }, [content, resize])

  return { textareaRef, resize }
}

// Plain overlay version — no sortable hooks
function StickyNoteOverlay({ note }: { note: Note }) {
  return (
    <div
      className="rounded-lg p-4 pb-3"
      style={{
        backgroundColor: NOTE_BG,
        boxShadow: `0 8px 24px ${NOTE_SHADOW}, 0 4px 8px rgba(0,0,0,0.15)`,
        transform: 'rotate(0deg) scale(1.03)',
        width: 248,
      }}
    >
      <div className="text-sm whitespace-pre-wrap" style={{ color: '#5D4037', minHeight: 60 }}>
        {note.content || 'Write something...'}
      </div>
    </div>
  )
}

function StickyNote({
  note,
  onUpdate,
  onDelete,
}: {
  note: Note
  onUpdate: (id: string, data: { content?: string }) => void
  onDelete: (id: string) => void
}) {
  const [localContent, setLocalContent] = useState(note.content)
  const { textareaRef, resize } = useAutoResize(localContent)
  const rotation = getRotation(note.id)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id })

  const style = {
    transform: isDragging
      ? CSS.Translate.toString(transform)
      : CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  // Sync local content when note prop changes
  useEffect(() => {
    setLocalContent(note.content)
  }, [note.content])

  const handleBlur = () => {
    if (localContent !== note.content) {
      onUpdate(note.id, { content: localContent })
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group mb-3"
    >
      <div
        className="rounded-lg p-4 pb-3"
        style={{
          backgroundColor: NOTE_BG,
          boxShadow: `0 2px 8px ${NOTE_SHADOW}, 0 1px 3px rgba(0,0,0,0.08)`,
          transform: `rotate(${rotation}deg)`,
        }}
      >
        {/* Drag handle + delete button row */}
        <div className="flex items-center justify-between mb-1 -mt-1">
          <button
            {...attributes}
            {...listeners}
            className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-black/20 hover:text-black/40 p-0.5"
            aria-label="Drag to reorder"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="3" r="1.5" />
              <circle cx="11" cy="3" r="1.5" />
              <circle cx="5" cy="8" r="1.5" />
              <circle cx="11" cy="8" r="1.5" />
              <circle cx="5" cy="13" r="1.5" />
              <circle cx="11" cy="13" r="1.5" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-black/30 hover:text-black/60 text-sm leading-none cursor-pointer"
            aria-label="Delete note"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <textarea
          ref={textareaRef}
          value={localContent}
          onChange={(e) => {
            setLocalContent(e.target.value)
            resize()
          }}
          onBlur={handleBlur}
          placeholder="Write something..."
          className="sticky-note-textarea"
          style={{ minHeight: 60, resize: 'vertical' }}
        />
      </div>
    </div>
  )
}

export default function NotesPanel({ notes, onCreate, onUpdate, onDelete, onReorder }: NotesPanelProps) {
  const [activeNote, setActiveNote] = useState<Note | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  const handleDragStart = (event: { active: { id: string | number } }) => {
    const note = notes.find((n) => n.id === event.active.id)
    if (note) setActiveNote(note)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveNote(null)
    const { active, over } = event
    if (!over || active.id === over.id) return
    onReorder(active.id as string, over.id as string)
  }

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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={notes.map((n) => n.id)}
              strategy={verticalListSortingStrategy}
            >
              {notes.map((note) => (
                <StickyNote
                  key={note.id}
                  note={note}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              ))}
            </SortableContext>

            <DragOverlay>
              {activeNote ? (
                <StickyNoteOverlay note={activeNote} />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </aside>
  )
}
