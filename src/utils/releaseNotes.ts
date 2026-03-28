export interface ReleaseSection {
  heading: string
  items: string[]
}

// Headings that exist for GitHub release page readers, not in-app display
const SKIP_HEADING_RE = /install|download|platform|building|build from/i

export function parseStructuredNotes(body: string): ReleaseSection[] {
  const lines = body.split('\n').map((l) => l.trim()).filter(Boolean)
  const sections: ReleaseSection[] = []
  let current: ReleaseSection | null = null
  let skip = false

  for (const line of lines) {
    if (/^#{1,3}\s/.test(line)) {
      const heading = line.replace(/^#+\s*/, '').trim()
      skip = SKIP_HEADING_RE.test(heading)
      if (!skip) {
        current = { heading, items: [] }
        sections.push(current)
      } else {
        current = null
      }
    } else if (!skip && /^[-*•]\s+/.test(line)) {
      const item = line.replace(/^[-*•]\s+/, '').trim()
      if (!current) {
        // Bullet items before any heading — ungrouped
        current = { heading: '', items: [] }
        sections.push(current)
      }
      current.items.push(item)
    }
  }

  return sections.filter((s) => s.items.length > 0)
}

// ── Section visual variants ──────────────────────────────────────────────────

export type SectionVariant = 'new' | 'improved' | 'fixed' | 'default'

export function sectionVariant(heading: string): SectionVariant {
  const h = heading.toLowerCase()
  if (/new|add|feature/.test(h)) return 'new'
  if (/improv|chang|better|update|enhanc/.test(h)) return 'improved'
  if (/fix|bug|patch|resolv/.test(h)) return 'fixed'
  return 'default'
}

export const VARIANT_DOT: Record<SectionVariant, string> = {
  new:      'bg-indigo-500',
  improved: 'bg-blue-500',
  fixed:    'bg-emerald-500',
  default:  'bg-slate-400 dark:bg-slate-600',
}

export const VARIANT_LABEL: Record<SectionVariant, string> = {
  new:      'text-indigo-600 dark:text-indigo-400',
  improved: 'text-blue-600 dark:text-blue-400',
  fixed:    'text-emerald-600 dark:text-emerald-400',
  default:  'text-slate-500 dark:text-slate-400',
}

// ── Per-version fallback notes ───────────────────────────────────────────────
// Shown when the GitHub API returns no content for this version.

export const FALLBACK_RELEASE_NOTES: Record<string, string> = {
  '1.0.2': `
## New

- Bulk actions on the Assignments page — select multiple assignments with checkboxes or shift-click a range, then mark done, mark not done, or delete in one step

## Improved

- Canvas feed URL import now fetches directly from Canvas with no third-party proxy — more reliable, and your private URL never leaves your device
- First launch now shows a clean welcome screen with clear setup options instead of placeholder data
- Empty states across all pages have clearer descriptions and direct action buttons
- Release notes now show structured sections (New / Improved / Fixed)

## Fixed

- "Network error fetching calendar" when pasting a Canvas feed URL
- Demo data no longer appears for new users or after using Reset data
  `.trim(),
}
