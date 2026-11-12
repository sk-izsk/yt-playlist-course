CREATE TABLE "tutor_usage" (
	"day" text NOT NULL,
	"audience" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "tutor_usage_day_audience_pk" PRIMARY KEY("day","audience")
);
