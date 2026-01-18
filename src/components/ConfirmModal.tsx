'use client'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null

  const variantStyles = {
    danger: {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      iconBg: '#FEE2E2',
      iconColor: '#DC2626',
      buttonBg: '#DC2626',
      buttonHover: '#B91C1C',
    },
    warning: {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      iconBg: '#FEF3C7',
      iconColor: '#D97706',
      buttonBg: '#D97706',
      buttonHover: '#B45309',
    },
    info: {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: '#DBEAFE',
      iconColor: '#2563EB',
      buttonBg: '#2563EB',
      buttonHover: '#1D4ED8',
    },
  }

  const styles = variantStyles[variant]

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ background: 'rgba(0, 0, 0, 0.4)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl animate-fadeIn overflow-hidden"
        style={{
          background: 'var(--bg-card)',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Icon */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: styles.iconBg, color: styles.iconColor }}
          >
            {styles.icon}
          </div>

          {/* Title */}
          <h3
            className="text-lg font-semibold text-center mb-2"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
            }}
          >
            {title}
          </h3>

          {/* Message */}
          <p
            className="text-sm text-center leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            {message}
          </p>
        </div>

        {/* Actions */}
        <div
          className="flex gap-3 p-4 border-t"
          style={{ borderColor: 'var(--border-light)', background: 'var(--bg-secondary)' }}
        >
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)'
              e.currentTarget.style.borderColor = 'var(--border-medium)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-card)'
              e.currentTarget.style.borderColor = 'var(--border-light)'
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ background: styles.buttonBg }}
            onMouseEnter={(e) => (e.currentTarget.style.background = styles.buttonHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = styles.buttonBg)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
