// Shared shapes for the site header (server Navbar → client SiteHeader).

export interface NavLink {
  label: string
  href: string
  description?: string
  icon?: string
  children?: NavLink[]
}

export interface FeaturedCasino {
  _id: string
  name: string
  slug?: string
  score?: number
  indbetalingsbonus?: string
  url?: string
  terms?: string | any[]
  minIndbetaling?: number
  gennemspilskrav?: string
  logo?: string
}

export interface NavItem {
  label: string
  href: string
  icon?: string
  isHighlighted?: boolean
  featuredLabel?: string
  panelNote?: string
  featured?: FeaturedCasino | null
  children: NavLink[]
}

export interface HeaderCta { label: string; href: string }
