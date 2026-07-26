'use client'

import { useMemo } from 'react'
import { Combobox } from '@/components/ui/Combobox'
import { useArtistSuggestions } from '@/hooks/useArtistSuggestions'
import { filterArtistSuggestions } from '@/lib/artistName'

type ArtistInputProps = {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  labelClassName?: string
  labelLineClassName?: string
}

/**
 * アーティスト名の入力欄。公開曲のアーティスト名をサジェストして表記ゆれを防ぐ。
 * 候補にない名前もそのまま入力できる。
 */
export const ArtistInput = ({
  label = 'アーティスト',
  value,
  onChange,
  placeholder,
  className,
  labelClassName,
  labelLineClassName,
}: ArtistInputProps) => {
  const candidates = useArtistSuggestions()
  const suggestions = useMemo(() => filterArtistSuggestions(candidates, value), [candidates, value])

  return (
    <Combobox
      label={label}
      value={value}
      onChange={onChange}
      suggestions={suggestions}
      placeholder={placeholder}
      className={className}
      labelClassName={labelClassName}
      labelLineClassName={labelLineClassName}
    />
  )
}
