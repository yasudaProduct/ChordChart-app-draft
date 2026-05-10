import { cn } from '@/lib/utils'

type ToggleProps = {
  checked: boolean
  onChange: () => void
  label?: string
  'aria-label'?: string
}

export const Toggle = ({ checked, onChange, label, 'aria-label': ariaLabel }: ToggleProps) => {
  return (
    <div className="flex items-center gap-2 rounded-md bg-slate-100 px-3 py-1 text-xs text-slate-600">
      {label && <span>{label}</span>}
      <button
        type="button"
        onClick={onChange}
        className={cn(
          'relative h-5 w-9 rounded-full transition',
          checked ? 'bg-primary' : 'bg-slate-300'
        )}
        aria-label={ariaLabel}
      >
        <span
          className={cn(
            'absolute left-1 top-1 h-3 w-3 rounded-full bg-white transition',
            checked && 'translate-x-4'
          )}
        />
      </button>
    </div>
  )
}
