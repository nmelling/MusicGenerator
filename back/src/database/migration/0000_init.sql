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
CREATE TABLE "music"."categoryFormPivot" (
	"categoryId" integer NOT NULL,
	"formId" integer NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "categoryFormPivot_categoryId_formId_pk" PRIMARY KEY("categoryId","formId")
);
--> statement-breakpoint
CREATE TABLE "music"."form" (
	"formId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "music"."form_formId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(50) NOT NULL,
	"deprecated" boolean DEFAULT false,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "music"."formQuestionPivot" (
	"formId" integer NOT NULL,
	"questionId" integer NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "formQuestionPivot_formId_questionId_pk" PRIMARY KEY("formId","questionId")
);
--> statement-breakpoint
CREATE TABLE "music"."question" (
	"questionId" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "music"."question_questionId_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"question" varchar(255) NOT NULL,
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
	"answer" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order"."order" (
	"orderId" char(20) PRIMARY KEY NOT NULL,
	"categoryId" integer NOT NULL,
	"email" varchar(255) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "music"."categoryFormPivot" ADD CONSTRAINT "categoryFormPivot_categoryId_category_categoryId_fk" FOREIGN KEY ("categoryId") REFERENCES "music"."category"("categoryId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music"."categoryFormPivot" ADD CONSTRAINT "categoryFormPivot_formId_form_formId_fk" FOREIGN KEY ("formId") REFERENCES "music"."form"("formId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music"."formQuestionPivot" ADD CONSTRAINT "formQuestionPivot_formId_form_formId_fk" FOREIGN KEY ("formId") REFERENCES "music"."form"("formId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music"."formQuestionPivot" ADD CONSTRAINT "formQuestionPivot_questionId_question_questionId_fk" FOREIGN KEY ("questionId") REFERENCES "music"."question"("questionId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order"."answer" ADD CONSTRAINT "answer_questionId_question_questionId_fk" FOREIGN KEY ("questionId") REFERENCES "music"."question"("questionId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order"."order" ADD CONSTRAINT "order_categoryId_category_categoryId_fk" FOREIGN KEY ("categoryId") REFERENCES "music"."category"("categoryId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_index" ON "order"."order" USING btree ("email");