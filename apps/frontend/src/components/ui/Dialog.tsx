'use client'

type DialogProps = {
  position: { x: number; y: number }
  width?: number
  onClose: () => void
  children: React.ReactNode
}

export const Dialog = ({ position, width = 320, onClose, children }: DialogProps) => {
  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      <div
        className="absolute rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
        style={{ left: position.x, top: position.y, width }}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
