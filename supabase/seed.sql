-- E2Eテスト用シードデータ
-- Supabase Auth にテストユーザーを作成する
-- auth.users への INSERT トリガーで public.Users にも自動的にレコードが作成される

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'authenticated',
  'authenticated',
  'test01@example.com',
  extensions.crypt('password123', extensions.gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"テストユーザー"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  jsonb_build_object('sub', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'email', 'test01@example.com'),
  'email',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  NOW(),
  NOW(),
  NOW()
);

-- ============================================================
-- デモ用楽曲データ（visibility = 'public'）
-- テストユーザーが所有する公開楽曲
-- ============================================================

INSERT INTO "Songs" ("Id", "UserId", "Title", "Artist", "Key", "Bpm", "TimeSignature", "Content", "Visibility", "CreatedAt", "UpdatedAt") VALUES
(
  '11111111-1111-1111-1111-111111111111',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'スタンド・バイ・ミー',
  'Ben E. King',
  'A',
  120,
  '4/4',
  '{"sections":[{"id":"s1a","name":"Intro","type":"chord-only","content":"{\"lines\":[{\"id\":\"l1a\",\"lyrics\":\"\",\"chords\":[{\"id\":\"c1a\",\"chord\":\"A\",\"offset\":0.0},{\"id\":\"c1b\",\"chord\":\"A\",\"offset\":0.25},{\"id\":\"c1c\",\"chord\":\"F#m\",\"offset\":0.5},{\"id\":\"c1d\",\"chord\":\"F#m\",\"offset\":0.75}]},{\"id\":\"l1b\",\"lyrics\":\"\",\"chords\":[{\"id\":\"c1e\",\"chord\":\"D\",\"offset\":0.0},{\"id\":\"c1f\",\"chord\":\"E\",\"offset\":0.25},{\"id\":\"c1g\",\"chord\":\"A\",\"offset\":0.5},{\"id\":\"c1h\",\"chord\":\"A\",\"offset\":0.75}]}]}"},{"id":"s1b","name":"Verse","type":"lyrics-chord","content":"{\"lines\":[{\"id\":\"l2a\",\"lyrics\":\"When the night has come\",\"chords\":[{\"id\":\"c2a\",\"chord\":\"A\",\"offset\":0.0}]},{\"id\":\"l2b\",\"lyrics\":\"And the land is dark\",\"chords\":[{\"id\":\"c2b\",\"chord\":\"F#m\",\"offset\":0.0}]},{\"id\":\"l2c\",\"lyrics\":\"And the moon is the only light we''ll see\",\"chords\":[{\"id\":\"c2c\",\"chord\":\"D\",\"offset\":0.0},{\"id\":\"c2d\",\"chord\":\"E\",\"offset\":0.35},{\"id\":\"c2e\",\"chord\":\"A\",\"offset\":0.7}]}]}"},{"id":"s1c","name":"Chorus","type":"lyrics-chord","content":"{\"lines\":[{\"id\":\"l3a\",\"lyrics\":\"So darling, darling, stand by me\",\"chords\":[{\"id\":\"c3a\",\"chord\":\"A\",\"offset\":0.0},{\"id\":\"c3b\",\"chord\":\"A\",\"offset\":0.55}]},{\"id\":\"l3b\",\"lyrics\":\"Oh stand by me\",\"chords\":[{\"id\":\"c3c\",\"chord\":\"F#m\",\"offset\":0.0}]},{\"id\":\"l3c\",\"lyrics\":\"Oh stand, stand by me, stand by me\",\"chords\":[{\"id\":\"c3d\",\"chord\":\"D\",\"offset\":0.0},{\"id\":\"c3e\",\"chord\":\"E\",\"offset\":0.3},{\"id\":\"c3f\",\"chord\":\"A\",\"offset\":0.65}]}]}"}]}',
  'public',
  NOW(),
  NOW()
),
(
  '22222222-2222-2222-2222-222222222222',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Let It Be',
  'The Beatles',
  'C',
  72,
  '4/4',
  '{"sections":[{"id":"s2a","name":"Verse 1","type":"lyrics-chord","content":"{\"lines\":[{\"id\":\"l4a\",\"lyrics\":\"When I find myself in times of trouble\",\"chords\":[{\"id\":\"c4a\",\"chord\":\"C\",\"offset\":0.0},{\"id\":\"c4b\",\"chord\":\"G\",\"offset\":0.55}]},{\"id\":\"l4b\",\"lyrics\":\"Mother Mary comes to me\",\"chords\":[{\"id\":\"c4c\",\"chord\":\"Am\",\"offset\":0.0},{\"id\":\"c4d\",\"chord\":\"F\",\"offset\":0.55}]},{\"id\":\"l4c\",\"lyrics\":\"Speaking words of wisdom\",\"chords\":[{\"id\":\"c4e\",\"chord\":\"C\",\"offset\":0.0},{\"id\":\"c4f\",\"chord\":\"G\",\"offset\":0.55}]},{\"id\":\"l4d\",\"lyrics\":\"Let it be\",\"chords\":[{\"id\":\"c4g\",\"chord\":\"F\",\"offset\":0.0},{\"id\":\"c4h\",\"chord\":\"C\",\"offset\":0.5}]}]}"},{"id":"s2b","name":"Chorus","type":"lyrics-chord","content":"{\"lines\":[{\"id\":\"l5a\",\"lyrics\":\"Let it be, let it be\",\"chords\":[{\"id\":\"c5a\",\"chord\":\"Am\",\"offset\":0.0},{\"id\":\"c5b\",\"chord\":\"G\",\"offset\":0.5}]},{\"id\":\"l5b\",\"lyrics\":\"Let it be, let it be\",\"chords\":[{\"id\":\"c5c\",\"chord\":\"F\",\"offset\":0.0},{\"id\":\"c5d\",\"chord\":\"C\",\"offset\":0.5}]},{\"id\":\"l5c\",\"lyrics\":\"Whisper words of wisdom\",\"chords\":[{\"id\":\"c5e\",\"chord\":\"C\",\"offset\":0.0},{\"id\":\"c5f\",\"chord\":\"G\",\"offset\":0.55}]},{\"id\":\"l5d\",\"lyrics\":\"Let it be\",\"chords\":[{\"id\":\"c5g\",\"chord\":\"F\",\"offset\":0.0},{\"id\":\"c5h\",\"chord\":\"C\",\"offset\":0.5}]}]}"}]}',
  'public',
  NOW(),
  NOW()
),
(
  '33333333-3333-3333-3333-333333333333',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '丸の内サディスティック',
  '椎名林檎',
  'Eb',
  100,
  '4/4',
  '{"sections":[{"id":"s3a","name":"Intro","type":"chord-only","content":"{\"lines\":[{\"id\":\"l6a\",\"lyrics\":\"\",\"chords\":[{\"id\":\"c6a\",\"chord\":\"Eb\",\"offset\":0.0},{\"id\":\"c6b\",\"chord\":\"Cm7\",\"offset\":0.25},{\"id\":\"c6c\",\"chord\":\"Fm7\",\"offset\":0.5},{\"id\":\"c6d\",\"chord\":\"Bb7\",\"offset\":0.75}]}]}"},{"id":"s3b","name":"Verse 1","type":"lyrics-chord","content":"{\"lines\":[{\"id\":\"l7a\",\"lyrics\":\"報酬は入社後並行線で\",\"chords\":[{\"id\":\"c7a\",\"chord\":\"EbM7\",\"offset\":0.0},{\"id\":\"c7b\",\"chord\":\"Cm7\",\"offset\":0.5}]},{\"id\":\"l7b\",\"lyrics\":\"東京は愛せど何も関せず\",\"chords\":[{\"id\":\"c7c\",\"chord\":\"Fm7\",\"offset\":0.0},{\"id\":\"c7d\",\"chord\":\"Bb7\",\"offset\":0.5}]},{\"id\":\"l7c\",\"lyrics\":\"大衆についたショートカット\",\"chords\":[{\"id\":\"c7e\",\"chord\":\"EbM7\",\"offset\":0.0},{\"id\":\"c7f\",\"chord\":\"Cm7\",\"offset\":0.5}]},{\"id\":\"l7d\",\"lyrics\":\"についたピアスが揺れる\",\"chords\":[{\"id\":\"c7g\",\"chord\":\"Fm7\",\"offset\":0.0},{\"id\":\"c7h\",\"chord\":\"Bb7\",\"offset\":0.5}]}]}"},{"id":"s3c","name":"Chorus","type":"lyrics-chord","content":"{\"lines\":[{\"id\":\"l8a\",\"lyrics\":\"丸の内サディスティック\",\"chords\":[{\"id\":\"c8a\",\"chord\":\"EbM7\",\"offset\":0.0},{\"id\":\"c8b\",\"chord\":\"Cm7\",\"offset\":0.5}]},{\"id\":\"l8b\",\"lyrics\":\"偽りのアリス\",\"chords\":[{\"id\":\"c8c\",\"chord\":\"Fm7\",\"offset\":0.0},{\"id\":\"c8d\",\"chord\":\"Bb7\",\"offset\":0.5}]}]}"}]}',
  'public',
  NOW(),
  NOW()
);
