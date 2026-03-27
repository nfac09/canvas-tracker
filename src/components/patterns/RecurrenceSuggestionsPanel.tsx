import { useStore } from '../../store'
import { getCourseById } from '../../store/selectors'
import { CategoryBadge } from '../ui/Badge'
import { formatTimeDisplay } from '../../utils/dateHelpers'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function RecurrenceSuggestionsPanel() {
  const suggestions = useStore((s) => s.recurrenceSuggestions)
  const courses = useStore((s) => s.courses)
  const assignments = useStore((s) => s.assignments)
  const acceptSuggestion = useStore((s) => s.acceptSuggestion)
  const dismissSuggestion = useStore((s) => s.dismissSuggestion)

  const pending = suggestions.filter((s) => s.status === 'pending')
  if (pending.length === 0) return null

  return (
    <div className="mb-8">
      {/* Section header */}
      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-[3px] h-[11px] rounded-full bg-amber-400/70 shrink-0" />
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-white/35">
          Suggested Recurring Patterns
        </p>
        <span className="min-w-[17px] h-[17px] px-1.5 rounded flex items-center justify-center text-[9px] font-bold text-white bg-amber-400 tabular-nums">
          {pending.length}
        </span>
        <p className="text-[11px] text-slate-400 dark:text-white/25 ml-1">
          Detected from imported assignments — confirm to start generating
        </p>
      </div>

      <div className="space-y-2">
        {pending.map((suggestion) => {
          const course = getCourseById(courses, suggestion.courseId)
          const evidenceAssignments = assignments.filter((a) =>
            suggestion.evidenceIds.includes(a.id),
          )

          return (
            <div
              key={suggestion.id}
              className="rounded-xl border border-amber-200/60 dark:border-amber-500/[0.15] bg-amber-50/40 dark:bg-amber-950/[0.10] overflow-hidden"
            >
              <div className="px-4 py-3 flex items-start gap-3">
                {/* Left: info */}
                <div className="flex-1 min-w-0">
                  {/* Course + confidence row */}
                  <div className="flex items-center gap-2 mb-1">
                    {course && (
                      <span className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-white/35 font-medium shrink-0">
                        <span
                          className="w-[5px] h-[5px] rounded-full"
                          style={{ backgroundColor: course.color }}
                        />
                        {course.name}
                      </span>
                    )}
                    <span
                      className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                        suggestion.confidence === 'high'
                          ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                          : 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {suggestion.confidence === 'high' ? 'High confidence' : 'Possible'}
                    </span>
                  </div>

                  {/* Pattern title */}
                  <p className="text-[14px] font-semibold text-slate-800 dark:text-white/80 leading-snug mb-0.5">
                    {suggestion.suggestedTitle}
                  </p>

                  {/* Cadence line */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-500 dark:text-white/35">
                      Every {DAY_NAMES[suggestion.dayOfWeek]}
                      {suggestion.dueTime ? ` at ${formatTimeDisplay(suggestion.dueTime)}` : ''}
                    </span>
                    {suggestion.category && (
                      <>
                        <span className="text-slate-200 dark:text-white/[0.09] text-[10px]">·</span>
                        <CategoryBadge category={suggestion.category} />
                      </>
                    )}
                    <span className="text-slate-200 dark:text-white/[0.09] text-[10px]">·</span>
                    <span className="text-[11px] text-slate-400 dark:text-white/25">
                      {suggestion.evidenceCount} occurrence{suggestion.evidenceCount !== 1 ? 's' : ''} found
                    </span>
                  </div>

                  {/* Evidence titles (up to 3) */}
                  {evidenceAssignments.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap mt-1.5">
                      {evidenceAssignments.slice(0, 3).map((a) => (
                        <span
                          key={a.id}
                          className="text-[10px] text-slate-400 dark:text-white/20 bg-slate-100 dark:bg-white/[0.04] px-1.5 py-0.5 rounded"
                        >
                          {a.title}
                        </span>
                      ))}
                      {evidenceAssignments.length > 3 && (
                        <span className="text-[10px] text-slate-400 dark:text-white/20">
                          +{evidenceAssignments.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                  <button
                    onClick={() => dismissSuggestion(suggestion.id)}
                    className="text-[11px] font-medium px-2.5 py-[5px] rounded-md
                      text-slate-400 dark:text-white/25
                      hover:text-slate-600 dark:hover:text-white/55
                      hover:bg-slate-100 dark:hover:bg-white/[0.07]
                      active:scale-[0.93] transition-all duration-100"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => acceptSuggestion(suggestion.id)}
                    className="text-[11px] font-medium px-2.5 py-[5px] rounded-md
                      text-white bg-indigo-600 dark:bg-indigo-500
                      hover:bg-indigo-500 dark:hover:bg-indigo-400
                      shadow-sm shadow-indigo-900/25 dark:shadow-indigo-900/40
                      active:scale-[0.93] transition-all duration-100"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
