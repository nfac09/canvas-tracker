import { useStore } from '../../store'

export function ThemeToggle() {
  const theme = useStore((s) => s.settings.theme)
  const updateSettings = useStore((s) => s.updateSettings)

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => updateSettings({ theme: isDark ? 'light' : 'dark' })}
      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="text-base">{isDark ? '☀' : '☾'}</span>
      <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
    </button>
  )
}
