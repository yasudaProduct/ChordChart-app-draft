import { cn } from '@/lib/utils'

type InputProps = {
  label?: string
  className?: string
  labelClassName?: string
  labelLineClassName?: string
} & React.InputHTMLAttributes<HTMLInputElement>

export const Input = ({
  label,
  className,
  labelClassName,
  labelLineClassName,
  ...rest
}: InputProps) => {
  const input = (
    <input
      className={cn(
        'w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary',
        className
      )}
      {...rest}
    />
  )

  if (!label) return input

  return (
    <label className={cn('text-xs font-medium text-slate-500', labelClassName)}>
      {labelLineClassName ? <span className={labelLineClassName}>{label}</span> : label}
      <div className="mt-2">{input}</div>
    </label>
  )
}
