import { songMetaEntries } from '@/lib/songMeta'
import type { MusicMeta, Section } from '@/types/song'

/**
 * セクションのメタ情報を解決するための入力。
 * `Song` 全体を要求しないことで、テストのフィクスチャを小さく保てる。
 */
export type SectionMetaSource = MusicMeta & { sections: Section[] }

export type ResolvedSectionMeta = {
  /** このセクションで実際に使う値（明示 → 引き継ぎ → 楽曲全体 → 未設定） */
  effective: MusicMeta
  /** このセクション自身に明示設定された値（エディタの入力欄・バッジ） */
  explicit: MusicMeta
  /** 明示設定を消した場合に適用される値（エディタの「継承: C」表示） */
  inherited: MusicMeta
  /** 直前のセクションの有効値から変化した項目だけ（閲覧画面のバッジ） */
  changed: MusicMeta
}

/**
 * 値が「設定済み」かを判定する。
 * 空文字（キー・拍子）や 0・NaN（BPM）は未設定として扱う。
 * パース時にも弾いているが、エディタからの直値やデモの localStorage 経由も通るため二重に防ぐ。
 */
const isSet = (value: string | number | undefined): boolean => {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0
  return typeof value === 'string' && value.trim() !== ''
}

/** 設定済みのフィールドだけを残す。 */
const definedMeta = (meta: MusicMeta): MusicMeta => ({
  key: isSet(meta.key) ? meta.key : undefined,
  bpm: isSet(meta.bpm) ? meta.bpm : undefined,
  timeSignature: isSet(meta.timeSignature) ? meta.timeSignature : undefined,
})

/**
 * `override` の設定済みフィールドだけを `base` に上書きする。
 * 単純なスプレッド（`{ ...base, ...override }`）だと override 側の undefined が
 * base の値を潰してしまうため、専用のマージが必要。
 */
const mergeMeta = (base: MusicMeta, override: MusicMeta): MusicMeta => ({
  key: isSet(override.key) ? override.key : base.key,
  bpm: isSet(override.bpm) ? override.bpm : base.bpm,
  timeSignature: isSet(override.timeSignature) ? override.timeSignature : base.timeSignature,
})

/** `current` のうち `previous` から変化したフィールドだけを返す。 */
const diffMeta = (previous: MusicMeta, current: MusicMeta): MusicMeta => ({
  key: current.key !== undefined && current.key !== previous.key ? current.key : undefined,
  bpm: current.bpm !== undefined && current.bpm !== previous.bpm ? current.bpm : undefined,
  timeSignature:
    current.timeSignature !== undefined && current.timeSignature !== previous.timeSignature
      ? current.timeSignature
      : undefined,
})

/**
 * 全セクションのキー・BPM・拍子を先頭から1パスで解決する（carry-forward）。
 *
 * 有効値はフィールドごとに独立して引き継がれる。たとえばサビで BPM だけを設定した場合、
 * キーはそれ以前に設定された値を引き継ぎ続ける。
 *
 * 戻り値は `source.sections` と同じ index 順。
 *
 * 注意: この関数は編集のたびに呼ばれるため、`section.content`（コード・歌詞の JSON）は
 * パースせず、セクション数に比例する純粋な走査に留める。
 */
export const resolveSectionMetas = (source: SectionMetaSource): ResolvedSectionMeta[] => {
  // 直前のセクションの有効値 = 次のセクションが引き継ぐ値。初期値は楽曲全体の値
  let inherited = definedMeta(source)

  return source.sections.map((section) => {
    const explicit = definedMeta(section)
    const effective = mergeMeta(inherited, explicit)
    const changed = diffMeta(inherited, effective)
    const resolved = { effective, explicit, inherited, changed }

    inherited = effective
    return resolved
  })
}

/** セクション ID から解決結果を引く。該当セクションが無ければ null。 */
export const resolveSectionMetaById = (
  source: SectionMetaSource,
  sectionId: string
): ResolvedSectionMeta | null => {
  const index = source.sections.findIndex((section) => section.id === sectionId)
  if (index === -1) return null
  return resolveSectionMetas(source)[index]
}

/**
 * 「Key Am · BPM 90 · 6/8」形式の1行ラベルを組み立てる。
 * 表示する項目が無ければ空文字を返す（呼び出し側は空なら何も描画しない）。
 */
export const sectionMetaLabel = (meta: MusicMeta): string =>
  songMetaEntries(meta)
    .map((entry) => (entry.label ? `${entry.label} ${entry.value}` : entry.value))
    .join(' · ')
