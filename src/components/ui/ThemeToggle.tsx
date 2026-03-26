import { useStore } from '../../store'

export function ThemeToggle() {
  const theme = useStore((s) => s.settings.theme)
  const updateSettings = useStore((s) => s.updateSettings)

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => updateSettings({ theme: isDark ? 'light' : 'dark' })}
      className="flex items-center gap-2 w-full px-3 py-[7px] rounded-lg text-[13px] text-slate-500 dark:text-[#8888a8] hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-800 dark:hover:text-white/80 transition-colors"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="text-[11px] opacity-70">{isDark ? '○' : '●'}</span>
      <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
    </button>
  )
}
