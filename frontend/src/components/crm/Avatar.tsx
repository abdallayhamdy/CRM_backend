import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  firstName?: string | null
  lastName?: string | null
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
}

const colors = [
  'bg-stage-cyan',
  'bg-stage-violet',
  'bg-stage-amber',
  'bg-stage-emerald',
  'bg-stage-pink',
  'bg-stage-blue',
  'bg-stage-orange',
  'bg-stage-teal',
]

function getInitials(first?: string | null, last?: string | null) {
  const f = (first || '').trim()
  const l = (last || '').trim()
  if (!f && !l) return '?'
  return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase()
}

function getColorIndex(name?: string | null) {
  const n = name || 'Unknown'
  let hash = 0
  for (let i = 0; i < n.length; i++) {
    hash = n.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % colors.length
}

export function Avatar({ 
  firstName = 'Unknown', 
  lastName = '', 
  avatarUrl, 
  size = 'md',
  className,
  ...props 
}: AvatarProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-12 h-12 text-lg',
  }

  const nameString = `${firstName || 'Unknown'} ${lastName || ''}`.trim()
  const colorClass = colors[getColorIndex(nameString)]
  const initials = getInitials(firstName, lastName)

  const [imgError, setImgError] = React.useState(false)

  return (
    <div 
      className={cn(
        "relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 font-medium text-primary-foreground",
        sizeClasses[size],
        !avatarUrl && colorClass,
        className
      )}
      title={nameString}
      {...props}
    >
      {avatarUrl && !imgError ? (
        <Image 
          src={avatarUrl} 
          alt={nameString} 
          fill
          sizes="100%"
          className="object-cover"
          unoptimized
          onError={() => setImgError(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}
