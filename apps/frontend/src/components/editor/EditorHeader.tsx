'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'

type EditorHeaderProps = {
  isDirty: boolean
  isSaving: boolean
  isPreview: boolean
  onSave: () => void
  /** 未指定の場合は共有ボタンを表示しない（デモモード等） */
  onShare?: () => void
  onPrint: () => void
  onTogglePreview: () => void
  onBack: () => void
}

export const EditorHeader = ({
  isDirty,
  isSaving,
  isPreview,
  onSave,
  onShare,
  onPrint,
  onTogglePreview,
  onBack,
}: EditorHeaderProps) => {
  return (
    <header className="print-hidden fixed top-0 z-50 flex w-full items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      <div className="flex items-center gap-4">
        <Link href="/" className="font-display text-lg font-semibold text-primary">
          ChordBook
        </Link>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          &larr; マイライブラリ
        </button>
        {isDirty && <span className="text-xs text-amber-600">未保存</span>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Toggle
          checked={isPreview}
          onChange={onTogglePreview}
          label="プレビュー"
          aria-label="プレビュー切替"
        />
        <Button variant="secondary" onClick={onPrint}>
          🖨 印刷 / PDF
        </Button>
        {onShare && (
          <Button variant="secondary" onClick={onShare}>
            ↗ 共有
          </Button>
        )}
        <Button variant="primary" onClick={onSave} disabled={isSaving}>
          {isSaving ? '保存中...' : '保存'}
        </Button>
      </div>
    </header>
  )
}
