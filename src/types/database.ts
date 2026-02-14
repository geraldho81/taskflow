export type TaskStatus = 'queue' | 'in_progress' | 'completed'

// Preset tag types for predefined styling
export type PresetTagType =
  | 'content-creation'
  | 'seo'
  | 'social-media'
  | 'paid-ads'
  | 'analytics'
  | 'urgent'
  | 'research'
  | 'client-meeting'
  | 'strategy'
  | 'design'

// Tags can be preset types or custom strings
export type TagType = PresetTagType | string

export interface SubTask {
  id: string
  text: string
  completed: boolean
}

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  deadline: string | null
  status: TaskStatus
  position: number
  tags: string[]
  subtasks: SubTask[]
  attachments: string[]
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateTaskInput {
  title: string
  description?: string | null
  deadline?: string | null
  tags?: string[]
  subtasks?: SubTask[]
}

export interface UpdateTaskInput {
  title?: string
  description?: string | null
  deadline?: string | null
  status?: TaskStatus
  position?: number
  tags?: string[]
  subtasks?: SubTask[]
}

// Note types
export interface Note {
  id: string
  user_id: string
  content: string
  color: string
  position: number
  pos_x: number
  pos_y: number
  width: number
  height: number
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: Task
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>
      }
      notes: {
        Row: Note
        Insert: Omit<Note, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Note, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}

// Tag configuration for preset tags
export const TAG_CONFIG: Record<PresetTagType, { label: string; className: string }> = {
  'content-creation': { label: 'Content Creation', className: 'tag-content' },
  'seo': { label: 'SEO', className: 'tag-seo' },
  'social-media': { label: 'Social Media', className: 'tag-social' },
  'paid-ads': { label: 'Paid Ads', className: 'tag-ads' },
  'analytics': { label: 'Analytics', className: 'tag-analytics' },
  'urgent': { label: 'Urgent', className: 'tag-urgent' },
  'research': { label: 'Research', className: 'tag-research' },
  'client-meeting': { label: 'Client Meeting', className: 'tag-meeting' },
  'strategy': { label: 'Strategy', className: 'tag-strategy' },
  'design': { label: 'Design', className: 'tag-design' },
}

// Preset tag IDs for checking
export const PRESET_TAGS = Object.keys(TAG_CONFIG) as PresetTagType[]

// Color palette for custom tags (soft pastels)
const CUSTOM_TAG_COLORS = [
  { bg: '#FEE2E2', text: '#991B1B' }, // Red
  { bg: '#FEF3C7', text: '#92400E' }, // Amber
  { bg: '#DCFCE7', text: '#166534' }, // Green
  { bg: '#DBEAFE', text: '#1E40AF' }, // Blue
  { bg: '#F3E8FF', text: '#6B21A8' }, // Purple
  { bg: '#FCE7F3', text: '#9D174D' }, // Pink
  { bg: '#CCFBF1', text: '#115E59' }, // Teal
  { bg: '#E0E7FF', text: '#3730A3' }, // Indigo
  { bg: '#FFEDD5', text: '#C2410C' }, // Orange
  { bg: '#D1FAE5', text: '#065F46' }, // Emerald
]

// Generate consistent color for custom tags based on string hash
export function getCustomTagColor(tag: string): { bg: string; text: string } {
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % CUSTOM_TAG_COLORS.length
  return CUSTOM_TAG_COLORS[index]
}

// Check if a tag is a preset tag
export function isPresetTag(tag: string): tag is PresetTagType {
  return PRESET_TAGS.includes(tag as PresetTagType)
}

// Get tag display info (works for both preset and custom tags)
export function getTagInfo(tag: string): { label: string; bg: string; text: string; className?: string } {
  if (isPresetTag(tag)) {
    const config = TAG_CONFIG[tag]
    return { label: config.label, bg: '', text: '', className: config.className }
  }
  const colors = getCustomTagColor(tag)
  // Use tag as-is, preserving user's original capitalization
  return { label: tag, bg: colors.bg, text: colors.text }
}
