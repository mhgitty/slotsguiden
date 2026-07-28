'use client'
import { type ReactNode } from 'react'

export function WideStudioLayout({ renderDefault, ...props }: { renderDefault: (p: any) => ReactNode; [key: string]: any }) {
  return (
    <>
      <style>{`
        /* ── Widen document/form panels ────────────────────────────── */
        [data-testid="document-panel-scroller"] > div,
        [data-testid="document-panel-document-view"] > div {
          max-width: none !important;
        }
        /* Field rows inside the form */
        [class*="FormField__Root"],
        [class*="FormFieldSet"],
        [class*="documentView"] > div {
          max-width: none !important;
        }
        /* Portable Text wrapper */
        [data-testid="pt-editor-box"] {
          max-width: none !important;
        }

        /* ── PTE heading colours (make visible on dark bg) ──────────── */
        [data-slate-editor="true"] h1,
        [data-slate-editor="true"] h2,
        [data-slate-editor="true"] h3,
        [data-slate-editor="true"] h4,
        [data-slate-editor="true"] h5,
        [data-slate-editor="true"] h6 {
          color: #ffffff !important;
        }
      `}</style>
      <div style={{ '--sanity-sidebar-width': '260px' } as React.CSSProperties}>
        {renderDefault(props)}
      </div>
    </>
  )
}
