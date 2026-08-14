'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type TooltipProps = {
  content: ReactNode
  children: ReactNode
  className?: string
  /** ツールチップの配置（トリガー基準） */
  side?: 'top' | 'bottom'
  /** パネルの水平位置（トリガー基準） */
  align?: 'center' | 'start'
}

/**
 * ホバー・フォーカスで表示するシンプルなツールチップ。
 * パネル内の操作可能要素にもマウスを移せるよう、トリガー下に余白を設ける。
 */
export const Tooltip = ({
  content,
  children,
  className,
  side = 'bottom',
  align = 'center',
}: TooltipProps) => {
  const panelPosition =
    side === 'bottom'
      ? cn('top-full pt-1.5', align === 'start' ? 'left-0' : 'left-1/2 -translate-x-1/2')
      : cn('bottom-full', align === 'start' ? 'left-0' : 'left-1/2 -translate-x-1/2', 'mb-1.5')

  return (
    <span className={cn('group/tooltip relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-50 w-max max-w-[240px] opacity-0 transition-opacity duration-150',
          'group-hover/tooltip:pointer-events-auto group-hover/tooltip:opacity-100',
          'group-focus-within/tooltip:pointer-events-auto group-focus-within/tooltip:opacity-100',
          panelPosition
        )}
      >
        <span className="block rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-600 shadow-lg">
          {content}
        </span>
      </span>
    </span>
  )
}
