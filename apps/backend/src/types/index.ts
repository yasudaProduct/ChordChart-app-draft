export const Visibility = {
  Private: 'private',
  UrlOnly: 'url_only',
  SpecificUsers: 'specific_users',
  Public: 'public',
} as const

export type Visibility = (typeof Visibility)[keyof typeof Visibility]
