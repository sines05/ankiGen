import { type ReactNode, useEffect, useState } from 'react'
import { NavLink, Link } from 'react-router-dom'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  })

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(t => t === 'light' ? 'dark' : 'light')
  }

  return (
    <div className="text-on-surface bg-background min-h-screen">
      <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-outline-variant/10">
        <div className="flex justify-between items-center h-16 px-6 lg:px-12 max-w-7xl mx-auto">
          <Link to="/" className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tighter text-slate-900 dark:text-white">Doc2Anki</span>
          </Link>
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex gap-8 items-center">
              <NavLink to="/" className={({ isActive }) => `${isActive ? 'text-indigo-600' : 'text-slate-500'} font-semibold tracking-tight`}>Upload</NavLink>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <span className="text-slate-400 font-medium cursor-not-allowed">Processing</span>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <NavLink to="/review" className={({ isActive }) => `${isActive ? 'text-indigo-600' : 'text-slate-500'} font-semibold tracking-tight`}>Review</NavLink>
            </nav>
            <button onClick={toggleTheme} className="material-symbols-outlined text-on-surface-variant transition-transform active:scale-90 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              {theme === 'light' ? 'dark_mode' : 'light_mode'}
            </button>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-32 max-w-5xl mx-auto px-6">
        {children}
      </main>
    </div>
  )
}
