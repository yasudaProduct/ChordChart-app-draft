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
