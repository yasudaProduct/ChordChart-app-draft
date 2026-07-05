'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

type KeyChangeDialogProps = {
  fromKey: string
  toKey: string
  /** 全セクションのコードも移調してキーを変更する */
  onTranspose: () => void
  /** コードはそのままキー表記のみ変更する */
  onKeyOnly: () => void
  onCancel: () => void
}

export const KeyChangeDialog = ({
  fromKey,
  toKey,
  onTranspose,
  onKeyOnly,
  onCancel,
}: KeyChangeDialogProps) => {
  // ESC でキャンセル
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label="キー変更の確認"
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-white/60 bg-white p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.6)]"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-900">
          キーを {fromKey} から {toKey} に変更します
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          コードも一緒に移調しますか？（例: {fromKey} → {toKey} に合わせて全セクションのコードを
          書き換えます）
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Button variant="primary" size="md" onClick={onTranspose}>
            コードも移調する
          </Button>
          <Button variant="secondary" size="md" onClick={onKeyOnly}>
            キー表記のみ変更する
          </Button>
          <Button variant="ghost" size="md" onClick={onCancel}>
            キャンセル
          </Button>
        </div>
      </div>
    </div>
  )
}
