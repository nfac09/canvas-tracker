import { useEffect, useState } from 'react'
import { Modal } from './Modal'
import {
  parseStructuredNotes,
  sectionVariant,
  VARIANT_DOT,
  VARIANT_LABEL,
  FALLBACK_RELEASE_NOTES,
  type ReleaseSection,
} from '../../utils/releaseNotes'

const LAST_SEEN_KEY = 'ct-last-seen-version'
const GITHUB_REPO = 'nfac09/canvas-tracker'

export function WhatsNewModal() {
  const [open, setOpen] = useState(false)
  const [version, setVersion] = useState('')
  const [sections, setSections] = useState<ReleaseSection[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!window.electronAPI) return

    window.electronAPI.getVersion().then(async (v) => {
      const lastSeen = localStorage.getItem(LAST_SEEN_KEY)

      if (lastSeen === null) {
        // Fresh install — record the version without showing the modal
        localStorage.setItem(LAST_SEEN_KEY, v)
        return
      }

      if (lastSeen === v) return  // already seen this version

      // Updated — mark as seen immediately so it only shows once
      localStorage.setItem(LAST_SEEN_KEY, v)
      setVersion(v)
      setOpen(true)
      setLoading(true)

      try {
        const res = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/releases/tags/v${v}`,
          { headers: { 'User-Agent': 'Canvas-Tracker-App' } },
        )
        if (res.ok) {
          const data = await res.json() as { body?: string }
          const parsed = parseStructuredNotes(data.body ?? '')
          if (parsed.length > 0) {
            setSections(parsed)
            setLoading(false)
            return
          }
        }
      } catch {
        // Network unavailable — fall through to local fallback
      }

      // Fall back to hardcoded notes for this version
      const fallback = FALLBACK_RELEASE_NOTES[v]
      if (fallback) {
        setSections(parseStructuredNotes(fallback))
      }
      setLoading(false)
    })
  }, [])

  if (!open) return null

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title={`What's new in v${version}`}
      size="md"
    >
      <div className="space-y-5">
        {loading ? (
          <p className="text-sm text-slate-400 dark:text-[#8888a8]">Loading release notes…</p>
        ) : sections.length > 0 ? (
          <div className="space-y-5">
            {sections.map((section, i) => {
              const variant = sectionVariant(section.heading)
              return (
                <div key={i}>
                  {section.heading && (
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${VARIANT_DOT[variant]}`} />
                      <span className={`text-[10px] font-semibold uppercase tracking-widest ${VARIANT_LABEL[variant]}`}>
                        {section.heading}
                      </span>
                    </div>
                  )}
                  <ul className="space-y-2 pl-3.5">
                    {section.items.map((item, j) => (
                      <li key={j} className="flex gap-2.5 text-[13px] text-slate-600 dark:text-[#9090aa] leading-relaxed">
                        <span className="text-slate-300 dark:text-white/15 shrink-0 mt-[3px] text-[9px]">—</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-[#8888a8]">
            Canvas Tracker has been updated to v{version}.
          </p>
        )}

        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/[0.06]">
          <button
            onClick={() =>
              window.electronAPI?.openExternal(
                `https://github.com/${GITHUB_REPO}/releases/tag/v${version}`,
              )
            }
            className="text-xs text-slate-400 dark:text-white/25 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            Full release notes ↗
          </button>
          <button
            onClick={() => setOpen(false)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </Modal>
  )
}
