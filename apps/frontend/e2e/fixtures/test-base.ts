import { test as base } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'

export { expect } from '@playwright/test'
export { setupClerkTestingToken }
export const test = base
