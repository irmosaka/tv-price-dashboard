// iOS-style icons using native emojis and symbols
export const Icons = {
  // Navigation
  home: '🏠',
  search: '🔍',
  chart: '📊',
  settings: '⚙️',
  bell: '🔔',
  user: '👤',
  
  // Actions
  add: '➕',
  edit: '✏️',
  delete: '🗑️',
  share: '↗️',
  download: '⬇️',
  filter: '⏳',
  
  // Status
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  loading: '⏳',
  
  // Products
  tv: '📺',
  brand: '🏷️',
  price: '💰',
  size: '📏',
  technology: '🔬',
  
  // Sources
  digikala: '🛒',
  tecnolife: '⚡',
  torob: '🔎',
  
  // Social
  github: '🐙',
  vercel: '▲',
  
  // Arrows (iOS style)
  chevronRight: '›',
  chevronLeft: '‹',
  arrowRight: '→',
  arrowUp: '↑',
  arrowDown: '↓',
  
  // Misc
  calendar: '📅',
  clock: '🕒',
  location: '📍',
  link: '🔗',
  wifi: '📶',
  battery: '🔋',
} as const;

interface IconProps {
  name: keyof typeof Icons;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 24, className = '' }: IconProps) {
  return (
    <span 
      className={`inline-block ${className}`}
      style={{ 
        fontSize: `${size}px`,
        lineHeight: 1,
        fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", sans-serif'
      }}
      role="img"
      aria-label={name}
    >
      {Icons[name]}
    </span>
  );
}
