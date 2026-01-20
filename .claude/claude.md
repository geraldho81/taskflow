# TaskFlow Project Instructions

## Git Workflow
- Always commit changes to git after completing edits (do not wait for user to ask)
- Always push to remote after committing

## Tech Stack
- Next.js 16 with App Router
- Supabase for database and auth
- @dnd-kit for drag and drop
- Tailwind CSS for styling
- Deployed on Vercel

## Key Files
- `src/components/KanbanBoard.tsx` - Main board with drag-drop logic
- `src/components/TaskModal.tsx` - Create/edit/view task modal
- `src/types/database.ts` - Types and tag configuration
- `supabase/schema.sql` - Database schema with RLS policies

## Known Patterns
- Drag-drop uses `dragStartStatus` state to track original column (handleDragOver modifies status for visual feedback)
- Tags preserve user's original capitalization (no forced casing)
- Previously used custom tags are shown as suggestions in the modal
- Subtasks are editable inline in edit mode (click to edit)

## Production URLs
- Production: taskflow-pi-dun.vercel.app
