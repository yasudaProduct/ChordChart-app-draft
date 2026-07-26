'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

type DialogProps = {
  /** 表示の基準点（クリック位置など）。この点の下・水平中央に配置する。 */
  position: { x: number; y: number }
  width?: number
  /** ビューポート上端の最小マージン（固定ヘッダーを避けたい場合に指定） */
  topMargin?: number
  onClose: () => void
  children: React.ReactNode
}

/** ビューポート端との最小マージン */
const MARGIN = 16
/** 基準点とダイアログ上端の間隔 */
const ANCHOR_GAP = 16

type Placement = { left: number; top: number; maxHeight: number }

export const Dialog = ({
  position,
  width = 320,
  topMargin = MARGIN,
  onClose,
  children,
}: DialogProps) => {
  const panelRef = useRef<HTMLDivElement>(null)
  const [placement, setPlacement] = useState<Placement | null>(null)

  /**
   * 実測サイズからビューポート内に収まる位置を決める。
   * 内容が増えて高さが伸びた場合（代理コードの表示など）でも画面外に隠れないよう、
   * 下端がはみ出すときは上方向へずらし、それでも収まらないときは内部スクロールにする。
   */
  const updatePlacement = useCallback(() => {
    const panel = panelRef.current
    if (!panel) return

    const { innerWidth: viewportWidth, innerHeight: viewportHeight } = window
    const height = panel.offsetHeight

    // 基準点を中心に置きつつ、左右がはみ出す場合は内側へ寄せる
    const left = Math.min(
      Math.max(MARGIN, position.x - width / 2),
      Math.max(MARGIN, viewportWidth - width - MARGIN)
    )
    // 基準点の下に置きつつ、下端がはみ出す場合は上方向へずらす
    const top = Math.min(
      Math.max(topMargin, position.y + ANCHOR_GAP),
      Math.max(topMargin, viewportHeight - height - MARGIN)
    )
    // ずらしても収まらない高さになった場合の最終手段（内部スクロール）
    const maxHeight = Math.max(0, viewportHeight - topMargin - MARGIN)

    setPlacement((prev) =>
      prev && prev.left === left && prev.top === top && prev.maxHeight === maxHeight
        ? prev
        : { left, top, maxHeight }
    )
  }, [position.x, position.y, width, topMargin])

  // 初回描画前に位置を確定させる（ちらつき防止）
  useLayoutEffect(() => {
    updatePlacement()
  }, [updatePlacement])

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return

    // 内容の変化による高さ変動に追従する
    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updatePlacement) : null
    observer?.observe(panel)
    window.addEventListener('resize', updatePlacement)

    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', updatePlacement)
    }
  }, [updatePlacement])

  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      <div
        ref={panelRef}
        className="absolute overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
        style={{
          left: placement?.left ?? position.x,
          top: placement?.top ?? position.y,
          width,
          maxHeight: placement?.maxHeight,
          // 実測前の未確定な位置で描画されるのを防ぐ
          visibility: placement ? 'visible' : 'hidden',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
