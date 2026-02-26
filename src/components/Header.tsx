'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface HeaderProps {
  userEmail: string
  searchQuery: string
  onSearchChange: (query: string) => void
  onExport: (format: 'json' | 'csv') => void
  onNewTask: () => void
}

export default function Header({
  userEmail,
  searchQuery,
  onSearchChange,
  onExport,
  onNewTask,
}: HeaderProps) {
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 border-b" style={{
      background: 'var(--bg-card)',
      borderColor: 'var(--border-light)'
    }}>
      <div className="px-3 py-3 sm:px-6 sm:py-4">
        {/* Mobile: two rows — logo+actions on top, search below */}
        {/* Desktop: single row — logo, search, actions */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2 sm:flex-nowrap sm:gap-x-6">
          {/* Logo — order 1 always */}
          <div className="flex items-center gap-3 order-1">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--accent)' }}
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h1
              className="text-xl font-semibold tracking-tight"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
            >
              TaskFlow
            </h1>
          </div>

          {/* Actions — order 2 on mobile (same row as logo, right-aligned), order 3 on sm+ */}
          <div className="flex items-center gap-2 sm:gap-3 order-2 ml-auto sm:ml-0 sm:order-3">
            <button
              onClick={onNewTask}
              className="btn btn-primary"
              style={{
                background: 'var(--accent)',
                fontSize: '13px',
                fontWeight: 500
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">New Task</span>
            </button>

            {/* Export */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="btn btn-secondary"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-secondary)',
                  fontSize: '13px'
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="hidden sm:inline">Export</span>
              </button>
              {showExportMenu && (
                <>
                  <div className="fixed inset-0" onClick={() => setShowExportMenu(false)} />
                  <div
                    className="absolute right-0 mt-2 w-40 rounded-lg py-1 animate-fadeIn"
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-light)',
                      boxShadow: 'var(--shadow-lg)'
                    }}
                  >
                    <button
                      onClick={() => {
                        onExport('json')
                        setShowExportMenu(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      Export as JSON
                    </button>
                    <button
                      onClick={() => {
                        onExport('csv')
                        setShowExportMenu(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      Export as CSV
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* User */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors"
                style={{ background: showUserMenu ? 'var(--bg-hover)' : 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = showUserMenu ? 'var(--bg-hover)' : 'transparent'}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
                  style={{ background: 'var(--accent)' }}
                >
                  {userEmail[0].toUpperCase()}
                </div>
                <svg
                  className="w-4 h-4 hidden sm:block"
                  style={{ color: 'var(--text-tertiary)' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showUserMenu && (
                <>
                  <div className="fixed inset-0" onClick={() => setShowUserMenu(false)} />
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-lg py-1 animate-fadeIn"
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-light)',
                      boxShadow: 'var(--shadow-lg)'
                    }}
                  >
                    <div
                      className="px-4 py-3 border-b"
                      style={{ borderColor: 'var(--border-light)' }}
                    >
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        Signed in as
                      </p>
                      <p
                        className="text-sm truncate mt-0.5"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {userEmail}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2.5 text-sm transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Search — order 3 on mobile (wraps to full-width second row), order 2 on sm+ */}
          <div className="order-3 w-full sm:order-2 sm:flex-1 sm:w-auto sm:max-w-md">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: 'var(--text-tertiary)' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full py-2 pr-4 rounded-md"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-light)',
                  fontSize: '13px',
                  paddingLeft: '36px',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
