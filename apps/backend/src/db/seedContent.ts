type SectionLine = {
  id: string
  lyrics: string
  chords: Array<{ id: string; chord: string; offset: number }>
}

const serializeSectionContent = (lines: SectionLine[]) => JSON.stringify({ lines })

const createChordLine = (prefix: string, chords: string[]): SectionLine => ({
  id: `${prefix}-line`,
  lyrics: '',
  chords: chords.map((chord, index) => ({
    id: `${prefix}-chord-${index}`,
    chord,
    offset: (index + 1) / (chords.length + 1),
  })),
})

const createChordSection = (prefix: string, name: string, chords: string[]) => ({
  id: `${prefix}-section`,
  name,
  type: 'chord-only' as const,
  content: serializeSectionContent([createChordLine(prefix, chords)]),
})

export const buildSongContent = (
  sections: Array<{ prefix: string; name: string; chords: string[] }>
) =>
  JSON.stringify({
    sections: sections.map(({ prefix, name, chords }) => createChordSection(prefix, name, chords)),
  })

// ============================================================
// 歌詞付き（lyrics-chord）セクション用ヘルパー
// ============================================================

/**
 * コード配置位置の指定方法。
 * - `at`: 歌詞テキスト中の文字インデックス（歌詞長で割って offset を求める）。
 *   ほぼ仮名書きの行など「1文字 ≒ 1拍（モーラ）」とみなせる場合に使う。
 * - `offset`: 0〜1 の比率を直接指定する。
 *   「蛍」「光」のように1漢字が複数拍を表す行では文字数と拍数がずれるため、
 *   実際の拍数から計算した比率をここで直接与える。
 */
type LyricChordSpec = { chord: string } & ({ at: number } | { offset: number })
type LyricLineSpec = { lyrics: string; chords: LyricChordSpec[] }

const createLyricsLine = (
  prefix: string,
  lyrics: string,
  chords: LyricChordSpec[]
): SectionLine => ({
  id: `${prefix}-line`,
  lyrics,
  // ChordSheet は offset(0〜1) を行幅に対する左位置(%)として使う。
  chords: chords.map((spec, index) => ({
    id: `${prefix}-chord-${index}`,
    chord: spec.chord,
    offset:
      'offset' in spec
        ? Math.min(Math.max(spec.offset, 0), 1)
        : lyrics.length === 0
          ? 0
          : Math.min(spec.at / lyrics.length, 1),
  })),
})

const createLyricsSection = (prefix: string, name: string, lines: LyricLineSpec[]) => ({
  id: `${prefix}-section`,
  name,
  type: 'lyrics-chord' as const,
  content: serializeSectionContent(
    lines.map((line, index) =>
      createLyricsLine(`${prefix}-line-${index}`, line.lyrics, line.chords)
    )
  ),
})

export const buildLyricsSongContent = (
  sections: Array<{ prefix: string; name: string; lines: LyricLineSpec[] }>
) =>
  JSON.stringify({
    sections: sections.map(({ prefix, name, lines }) => createLyricsSection(prefix, name, lines)),
  })

export const sampleSongContents = [
  buildSongContent([
    { prefix: 'song-a-intro', name: 'Intro', chords: ['C', 'G', 'Am', 'F'] },
    { prefix: 'song-a-verse', name: 'Verse', chords: ['Am', 'F', 'C', 'G'] },
    { prefix: 'song-a-chorus', name: 'Chorus', chords: ['F', 'G', 'C', 'Am'] },
  ]),
  buildSongContent([
    { prefix: 'song-b-intro', name: 'Intro', chords: ['Em', 'C', 'G', 'D'] },
    { prefix: 'song-b-verse', name: 'Verse', chords: ['G', 'D', 'Em', 'C'] },
  ]),
  buildSongContent([
    { prefix: 'song-c-verse', name: 'Verse', chords: ['Dm', 'Bb', 'F', 'C'] },
    { prefix: 'song-c-chorus', name: 'Chorus', chords: ['Bb', 'C', 'F', 'Dm'] },
  ]),
]
