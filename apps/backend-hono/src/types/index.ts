export const Visibility = {
  Private: 0,
  UrlOnly: 1,
  SpecificUsers: 2,
  Public: 3,
} as const

export type Visibility = (typeof Visibility)[keyof typeof Visibility]
