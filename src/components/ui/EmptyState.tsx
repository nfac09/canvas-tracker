interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <span className="text-3xl mb-3 opacity-70">{icon}</span>
      <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-400 dark:text-slate-600 max-w-xs leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
