import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md'

type ButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  className?: string
  children: React.ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-primary font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60',
  secondary: 'border border-slate-200 text-slate-700 transition hover:border-slate-400',
  ghost: 'text-slate-600 transition hover:bg-slate-100',
  danger: 'border border-red-200 text-red-600 transition hover:border-red-400',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'rounded-md px-3 py-2 text-xs',
  md: 'rounded-full px-4 py-2 text-sm',
}

export const Button = ({
  variant = 'primary',
  size = 'sm',
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) => {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(variantStyles[variant], sizeStyles[size], className)}
      {...rest}
    >
      {children}
    </button>
  )
}
