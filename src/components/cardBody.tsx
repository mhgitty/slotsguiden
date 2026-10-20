import type { PortableTextComponents } from '@portabletext/react'

// Shared Portable Text components for the body text inside casino/bonus cards.
export const cardBodyComponents: PortableTextComponents = {
  block: { normal: ({ children }) => <p>{children}</p> },
  list: {
    bullet: ({ children }) => <ul className="kc-list">{children}</ul>,
    number: ({ children }) => <ol className="kc-list">{children}</ol>,
  },
  listItem: { bullet: ({ children }) => <li>{children}</li>, number: ({ children }) => <li>{children}</li> },
  marks: {
    strong: ({ children }) => <strong>{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    link: ({ value, children }: any) => {
      const rel = ['noopener', 'noreferrer', value?.nofollow ? 'nofollow' : ''].filter(Boolean).join(' ')
      return <a href={value?.href} target={value?.blank ? '_blank' : '_self'} rel={rel}>{children}</a>
    },
  },
}

// Rough visible length of a Portable Text array (decides whether to fold)
export function ptLength(blocks?: any[]): number {
  if (!Array.isArray(blocks)) return 0
  return blocks.reduce((n, b) => n + (b?.children || []).reduce((m: number, c: any) => m + (c?.text?.length || 0), 0), 0)
}
