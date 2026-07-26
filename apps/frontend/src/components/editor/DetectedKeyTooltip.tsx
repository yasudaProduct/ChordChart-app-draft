'use client'

import { Tooltip } from '@/components/ui/Tooltip'

type DetectedKeyTooltipProps = {
  detectedKey: string
  onApply: () => void
}

/** コード進行から推定したキーを「キー」ラベル横に表示する */
export const DetectedKeyTooltip = ({ detectedKey, onApply }: DetectedKeyTooltipProps) => (
  <Tooltip
    align="start"
    content={
      <>
        <p className="font-medium text-slate-700">推定キー: {detectedKey}</p>
        <p className="mt-1 text-[11px] text-slate-500">
          コード進行から推定しました。適用してもコードは移調しません。
        </p>
        <button
          type="button"
          onClick={onApply}
          className="mt-2 w-full rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-medium text-white transition hover:bg-emerald-700"
        >
          適用
        </button>
      </>
    }
  >
    <button
      type="button"
      className="inline-flex h-4 shrink-0 items-center rounded bg-emerald-50 px-1.5 text-[10px] font-semibold leading-none text-emerald-700 ring-1 ring-emerald-200/80 transition hover:bg-emerald-100"
      aria-label={`推定キー ${detectedKey}。詳細を表示`}
    >
      {detectedKey}
    </button>
  </Tooltip>
)
