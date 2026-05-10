CREATE TYPE "public"."visibility" AS ENUM('private', 'url_only', 'specific_users', 'public');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Bookmarks" (
	"Id" uuid PRIMARY KEY NOT NULL,
	"UserId" text NOT NULL,
	"SongId" uuid NOT NULL,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "SongShares" (
	"Id" uuid PRIMARY KEY NOT NULL,
	"SongId" uuid NOT NULL,
	"ShareToken" text NOT NULL,
	"ExpiresAt" timestamp with time zone,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Songs" (
	"Id" uuid PRIMARY KEY NOT NULL,
	"UserId" text NOT NULL,
	"Title" varchar(200) NOT NULL,
	"Artist" varchar(200),
	"Key" varchar(10),
	"Bpm" integer,
	"TimeSignature" varchar(10) DEFAULT '4/4' NOT NULL,
	"Content" text DEFAULT '[]' NOT NULL,
	"Visibility" "visibility" DEFAULT 'private' NOT NULL,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Users" (
	"Id" text PRIMARY KEY NOT NULL,
	"Email" text NOT NULL,
	"DisplayName" text,
	"AvatarUrl" text,
	"CreatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"UpdatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Bookmarks" ADD CONSTRAINT "Bookmarks_UserId_Users_Id_fk" FOREIGN KEY ("UserId") REFERENCES "public"."Users"("Id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Bookmarks" ADD CONSTRAINT "Bookmarks_SongId_Songs_Id_fk" FOREIGN KEY ("SongId") REFERENCES "public"."Songs"("Id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "SongShares" ADD CONSTRAINT "SongShares_SongId_Songs_Id_fk" FOREIGN KEY ("SongId") REFERENCES "public"."Songs"("Id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Songs" ADD CONSTRAINT "Songs_UserId_Users_Id_fk" FOREIGN KEY ("UserId") REFERENCES "public"."Users"("Id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Bookmarks_UserId_SongId" ON "Bookmarks" USING btree ("UserId","SongId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "IX_SongShares_ShareToken" ON "SongShares" USING btree ("ShareToken");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IX_Songs_UserId" ON "Songs" USING btree ("UserId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IX_Songs_Visibility" ON "Songs" USING btree ("Visibility");