CREATE SCHEMA "auth";
--> statement-breakpoint
CREATE SCHEMA "music";
--> statement-breakpoint
CREATE SCHEMA "order";
--> statement-breakpoint
CREATE TABLE "music"."category" (
	"categoryId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "music"."category_categoryId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(50) NOT NULL,
	"description" varchar(255),
	"prompt" text NOT NULL,
	"deprecated" boolean DEFAULT false,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "music"."categoryQuestionPivot" (
	"categoryId" integer NOT NULL,
	"questionId" integer NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "categoryQuestionPivot_categoryId_questionId_pk" PRIMARY KEY("categoryId","questionId")
);
--> statement-breakpoint
CREATE TABLE "music"."question" (
	"questionId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "music"."question_questionId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"question" varchar(255) NOT NULL,
	"prompt" text,
	"placeholder" varchar(50),
	"isRequired" boolean DEFAULT false,
	"deprecated" boolean DEFAULT false,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "order"."answer" (
	"answerId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "order"."answer_answerId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"questionId" integer NOT NULL,
	"answer" text NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "order"."lyrics" (
	"lyricsId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "order"."lyrics_lyricsId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"orderId" char(20) NOT NULL,
	"lyrics" text NOT NULL,
	"deprecated" boolean DEFAULT false,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "order"."order" (
	"orderId" char(20) PRIMARY KEY NOT NULL,
	"categoryId" integer NOT NULL,
	"email" varchar(255) NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "music"."categoryQuestionPivot" ADD CONSTRAINT "categoryQuestionPivot_categoryId_category_categoryId_fk" FOREIGN KEY ("categoryId") REFERENCES "music"."category"("categoryId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music"."categoryQuestionPivot" ADD CONSTRAINT "categoryQuestionPivot_questionId_question_questionId_fk" FOREIGN KEY ("questionId") REFERENCES "music"."question"("questionId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order"."answer" ADD CONSTRAINT "answer_questionId_question_questionId_fk" FOREIGN KEY ("questionId") REFERENCES "music"."question"("questionId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order"."lyrics" ADD CONSTRAINT "lyrics_orderId_order_orderId_fk" FOREIGN KEY ("orderId") REFERENCES "order"."order"("orderId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order"."order" ADD CONSTRAINT "order_categoryId_category_categoryId_fk" FOREIGN KEY ("categoryId") REFERENCES "music"."category"("categoryId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_index" ON "order"."lyrics" USING btree ("orderId");--> statement-breakpoint
CREATE INDEX "email_index" ON "order"."order" USING btree ("email");