ALTER TABLE "Songs" ALTER COLUMN "Content" SET DEFAULT '{"sections":[]}';--> statement-breakpoint
ALTER TABLE "Songs" ADD COLUMN "IsDemo" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IX_Songs_IsDemo" ON "Songs" USING btree ("IsDemo");