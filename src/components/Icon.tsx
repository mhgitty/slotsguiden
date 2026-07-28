import { Icon as Iconify } from '@iconify/react'

interface IconProps {
  name: string          // e.g. "home-2" — prefix "solar:" added automatically
  size?: number
  color?: string
  className?: string
  style?: React.CSSProperties
}

/**
 * Solar icon wrapper — uses Bold Duotone style by default.
 * Pass variant to override, e.g. variant="linear" or variant="bold"
 */
export function Icon({ name, size = 20, color, className, style }: IconProps) {
  return (
    <Iconify
      icon={`solar:${name}-bold-duotone`}
      width={size}
      height={size}
      color={color}
      className={className}
      style={style}
    />
  )
}
