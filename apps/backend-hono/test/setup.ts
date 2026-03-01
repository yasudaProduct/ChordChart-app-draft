import { vi } from 'vitest'

// テスト環境の環境変数
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.ALLOWED_ORIGINS = 'http://localhost:3000'
process.env.PORT = '8080'
