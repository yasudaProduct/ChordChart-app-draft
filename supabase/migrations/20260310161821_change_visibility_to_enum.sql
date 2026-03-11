-- Drop the policy that depends on Visibility column
DROP POLICY "Users can view own or public songs" ON "Songs";

-- Create the visibility enum type
CREATE TYPE visibility AS ENUM ('private', 'url_only', 'specific_users', 'public');

-- Convert the integer column to enum
ALTER TABLE "Songs"
  ALTER COLUMN "Visibility" DROP DEFAULT,
  ALTER COLUMN "Visibility" SET DATA TYPE visibility
    USING CASE "Visibility"
      WHEN 0 THEN 'private'::visibility
      WHEN 1 THEN 'url_only'::visibility
      WHEN 2 THEN 'specific_users'::visibility
      WHEN 3 THEN 'public'::visibility
      ELSE 'private'::visibility
    END,
  ALTER COLUMN "Visibility" SET DEFAULT 'private'::visibility;

-- Recreate the policy with enum value
CREATE POLICY "Users can view own or public songs"
  ON "Songs"
  FOR SELECT
  USING (
    (( SELECT auth.uid() AS uid) = "UserId") OR ("Visibility" = 'public')
  );
