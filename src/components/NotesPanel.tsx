'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Note } from '@/types/database'

const NOTE_BG = '#FFF9C4'
const NOTE_SHADOW = 'rgba(255, 235, 59, 0.3)'
const MIN_W = 140
const MIN_H = 80

interface NotesPanelProps {
  notes: Note[]
  onCreate: () => void
  onUpdate: (id: string, data: { content?: string }) => void
  onDelete: (id: string) => void
  onMoveNote: (id: string, x: number, y: number) => void
  onResizeNote: (id: string, w: number, h: number) => void
}

function useAutoResize(content: string) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const resize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [])
  useEffect(() => { resize() }, [content, resize])
  return { textareaRef, resize }
}

function getRotation(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return (Math.abs(hash) % 5) - 2
}

type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

function StickyNote({
  note,
  onUpdate,
  onDelete,
  onMoveNote,
  onResizeNote,
  containerRef,
}: {
  note: Note
  onUpdate: (id: string, data: { content?: string }) => void
  onDelete: (id: string) => void
  onMoveNote: (id: string, x: number, y: number) => void
  onResizeNote: (id: string, w: number, h: number) => void
  containerRef: React.RefObject<HTMLDivElement | null>
}) {
  const [localContent, setLocalContent] = useState(note.content)
  const { textareaRef, resize } = useAutoResize(localContent)
  const rotation = getRotation(note.id)

  // Local position/size for smooth dragging (updated optimistically)
  const [pos, setPos] = useState({ x: note.pos_x, y: note.pos_y })
  const [size, setSize] = useState({ w: note.width, h: note.height })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)

  // Sync from props when not actively interacting
  useEffect(() => {
    if (!isDragging) setPos({ x: note.pos_x, y: note.pos_y })
  }, [note.pos_x, note.pos_y, isDragging])
  useEffect(() => {
    if (!isResizing) setSize({ w: note.width, h: note.height })
  }, [note.width, note.height, isResizing])
  useEffect(() => {
    setLocalContent(note.content)
  }, [note.content])

  const handleBlur = () => {
    if (localContent !== note.content) {
      onUpdate(note.id, { content: localContent })
    }
  }

  // --- Drag to move ---
  const handleDragStart = useCallback((e: React.PointerEvent) => {
    // Only drag from the handle area
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)

    const startX = e.clientX
    const startY = e.clientY
    const startPosX = pos.x
    const startPosY = pos.y
    const container = containerRef.current
    const containerRect = container?.getBoundingClientRect()

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      let newX = startPosX + dx
      let newY = startPosY + dy

      // Clamp to container bounds
      if (containerRect && container) {
        newX = Math.max(0, Math.min(newX, container.scrollWidth - size.w))
        newY = Math.max(0, Math.min(newY, container.scrollHeight - size.h))
      }

      setPos({ x: newX, y: newY })
    }

    const onUp = () => {
      setIsDragging(false)
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      // Persist final position
      setPos((p) => {
        onMoveNote(note.id, p.x, p.y)
        return p
      })
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }, [pos.x, pos.y, size.w, size.h, containerRef, note.id, onMoveNote])

  // --- Resize from edges ---
  const handleResizeStart = useCallback((e: React.PointerEvent, dir: ResizeDir) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)

    const startX = e.clientX
    const startY = e.clientY
    const startW = size.w
    const startH = size.h
    const startPosX = pos.x
    const startPosY = pos.y

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY

      let newW = startW
      let newH = startH
      let newX = startPosX
      let newY = startPosY

      if (dir.includes('e')) newW = Math.max(MIN_W, startW + dx)
      if (dir.includes('w')) {
        newW = Math.max(MIN_W, startW - dx)
        newX = startPosX + (startW - newW)
      }
      if (dir.includes('s')) newH = Math.max(MIN_H, startH + dy)
      if (dir.includes('n')) {
        newH = Math.max(MIN_H, startH - dy)
        newY = startPosY + (startH - newH)
      }

      setSize({ w: newW, h: newH })
      setPos({ x: newX, y: newY })
    }

    const onUp = () => {
      setIsResizing(false)
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      setSize((s) => {
        onResizeNote(note.id, s.w, s.h)
        return s
      })
      setPos((p) => {
        onMoveNote(note.id, p.x, p.y)
        return p
      })
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }, [size.w, size.h, pos.x, pos.y, note.id, onMoveNote, onResizeNote])

  const edgeSize = 6
  const cornerSize = 10

  return (
    <div
      className="absolute group"
      style={{
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: size.h,
        zIndex: isDragging || isResizing ? 50 : 1,
      }}
    >
      {/* Note body */}
      <div
        className="rounded-lg p-3 pb-2 w-full h-full flex flex-col overflow-hidden"
        style={{
          backgroundColor: NOTE_BG,
          boxShadow: isDragging
            ? `0 8px 24px ${NOTE_SHADOW}, 0 4px 8px rgba(0,0,0,0.15)`
            : `0 2px 8px ${NOTE_SHADOW}, 0 1px 3px rgba(0,0,0,0.08)`,
          transform: isDragging ? 'rotate(0deg) scale(1.02)' : `rotate(${rotation}deg)`,
          transition: isDragging ? 'box-shadow 0.15s' : 'transform 0.15s, box-shadow 0.15s',
        }}
      >
        {/* Header: drag handle + delete */}
        <div className="flex items-center justify-between mb-1 flex-shrink-0">
          <div
            onPointerDown={handleDragStart}
            className="cursor-grab active:cursor-grabbing text-black/20 hover:text-black/40 p-0.5 touch-none"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="3" r="1.5" />
              <circle cx="11" cy="3" r="1.5" />
              <circle cx="5" cy="8" r="1.5" />
              <circle cx="11" cy="8" r="1.5" />
              <circle cx="5" cy="13" r="1.5" />
              <circle cx="11" cy="13" r="1.5" />
            </svg>
          </div>
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
          onChange={(e) => { setLocalContent(e.target.value); resize() }}
          onBlur={handleBlur}
          placeholder="Write something..."
          className="note-textarea flex-1"
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            width: '100%',
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            lineHeight: 1.5,
            color: '#5D4037',
            overflow: 'auto',
          }}
        />
      </div>

      {/* Resize handles — edges */}
      <div onPointerDown={(e) => handleResizeStart(e, 'n')} className="absolute top-0 left-[10px] right-[10px] cursor-ns-resize touch-none" style={{ height: edgeSize }} />
      <div onPointerDown={(e) => handleResizeStart(e, 's')} className="absolute bottom-0 left-[10px] right-[10px] cursor-ns-resize touch-none" style={{ height: edgeSize }} />
      <div onPointerDown={(e) => handleResizeStart(e, 'w')} className="absolute left-0 top-[10px] bottom-[10px] cursor-ew-resize touch-none" style={{ width: edgeSize }} />
      <div onPointerDown={(e) => handleResizeStart(e, 'e')} className="absolute right-0 top-[10px] bottom-[10px] cursor-ew-resize touch-none" style={{ width: edgeSize }} />

      {/* Resize handles — corners */}
      <div onPointerDown={(e) => handleResizeStart(e, 'nw')} className="absolute top-0 left-0 cursor-nwse-resize touch-none" style={{ width: cornerSize, height: cornerSize }} />
      <div onPointerDown={(e) => handleResizeStart(e, 'ne')} className="absolute top-0 right-0 cursor-nesw-resize touch-none" style={{ width: cornerSize, height: cornerSize }} />
      <div onPointerDown={(e) => handleResizeStart(e, 'sw')} className="absolute bottom-0 left-0 cursor-nesw-resize touch-none" style={{ width: cornerSize, height: cornerSize }} />
      <div onPointerDown={(e) => handleResizeStart(e, 'se')} className="absolute bottom-0 right-0 cursor-nwse-resize touch-none" style={{ width: cornerSize, height: cornerSize }} />
    </div>
  )
}

export default function NotesPanel({ notes, onCreate, onUpdate, onDelete, onMoveNote, onResizeNote }: NotesPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <aside className="flex-1 min-w-[200px] hidden lg:block">
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

      {/* Free-form canvas */}
      <div
        ref={containerRef}
        className="relative overflow-auto"
        style={{ height: 'calc(100vh - 160px)' }}
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
              onMoveNote={onMoveNote}
              onResizeNote={onResizeNote}
              containerRef={containerRef}
            />
          ))
        )}
      </div>
    </aside>
  )
}
