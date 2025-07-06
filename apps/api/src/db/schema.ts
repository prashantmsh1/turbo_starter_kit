import {
    pgTable,
    text,
    varchar,
    timestamp,
    uuid,
    integer,
    decimal,
    primaryKey,
    boolean,
    jsonb,
    real,
    pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums for status fields to ensure data consistency
export const subscriptionStatusEnum = pgEnum("subscription_status", [
    "active",
    "cancelled",
    "expired",
    "past_due",
]);
export const videoStatusEnum = pgEnum("video_status", [
    "PENDING",
    "PROCESSING",
    "COMPLETED",
    "FAILED",
]);
export const auditActionEnum = pgEnum("audit_action", [
    "USER_REGISTER",
    "USER_LOGIN",
    "USER_LOGOUT",
    "VIDEO_SUBMIT",
    "VIDEO_PROCESS_SUCCESS",
    "VIDEO_PROCESS_FAIL",
    "SUBSCRIPTION_CHANGE",
]);

// --- Core User and Authentication Tables ---

export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userRelations = relations(users, ({ one, many }) => ({
    subscription: one(subscriptions),
    videos: many(videos),
    usageRecords: many(usageRecords),
    auditLogs: many(auditLogs),
}));

// --- Subscription and Billing Tables ---

export const subscriptionTiers = pgTable("subscription_tiers", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 50 }).notNull().unique(), // e.g., 'Free', 'Pro', 'Enterprise'
    videoLimitPerMonth: integer("video_limit_per_month").notNull(),
    maxVideoDurationMinutes: integer("max_video_duration_minutes").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    papalPriceId: text("papal_price_id").unique(), // For integrating with papal
});

export const subscriptions = pgTable("subscriptions", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
        .notNull()
        .unique()
        .references(() => users.id, { onDelete: "cascade" }),
    tierId: uuid("tier_id")
        .notNull()
        .references(() => subscriptionTiers.id, { onDelete: "restrict" }),
    status: subscriptionStatusEnum("status").notNull(),
    currentPeriodStart: timestamp("current_period_start").notNull(),
    currentPeriodEnd: timestamp("current_period_end").notNull(),
    canceledAt: timestamp("canceled_at"),
    papalSubscriptionId: text("papal_subscription_id").unique(),
});

export const subscriptionRelations = relations(subscriptions, ({ one }) => ({
    user: one(users, {
        fields: [subscriptions.userId],
        references: [users.id],
    }),
    tier: one(subscriptionTiers, {
        fields: [subscriptions.tierId],
        references: [subscriptionTiers.id],
    }),
}));

// --- Core Application Logic Tables ---

export const videos = pgTable("videos", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    youtubeUrl: text("youtube_url").notNull(),
    videoTitle: text("video_title"),
    videoDurationSeconds: integer("video_duration_seconds"),
    status: videoStatusEnum("status").default("PENDING").notNull(),
    jobId: varchar("job_id", { length: 255 }).unique(),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    processingStartedAt: timestamp("processing_started_at"),
    completedAt: timestamp("completed_at"),
});

export const videoRelations = relations(videos, ({ one, many }) => ({
    user: one(users, {
        fields: [videos.userId],
        references: [users.id],
    }),
    transcript: one(transcripts),
    catchyMoments: many(catchyMoments),
}));

export const transcripts = pgTable("transcripts", {
    id: uuid("id").defaultRandom().primaryKey(),
    videoId: uuid("video_id")
        .notNull()
        .unique()
        .references(() => videos.id, { onDelete: "cascade" }),
    content: jsonb("content").notNull(), // Store the full verbose JSON from Whisper
    wordCount: integer("word_count"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transcriptRelations = relations(transcripts, ({ one }) => ({
    video: one(videos, {
        fields: [transcripts.videoId],
        references: [videos.id],
    }),
}));

export const catchyMoments = pgTable("catchy_moments", {
    id: uuid("id").defaultRandom().primaryKey(),
    videoId: uuid("video_id")
        .notNull()
        .references(() => videos.id, { onDelete: "cascade" }),
    startTime: real("start_time").notNull(),
    endTime: real("end_time").notNull(),
    clipRelativePath: text("clip_relative_path"), // e.g., 'clips/user_id/video_id/moment_id.mp4'
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const catchyMomentRelations = relations(catchyMoments, ({ one }) => ({
    video: one(videos, {
        fields: [catchyMoments.videoId],
        references: [videos.id],
    }),
}));

// --- Usage Tracking and Auditing Tables ---

export const usageRecords = pgTable("usage_records", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    videoId: uuid("video_id").references(() => videos.id, { onDelete: "set null" }),
    month: integer("month").notNull(), // e.g., 202507 for July 2025
    year: integer("year").notNull(),
    videosProcessed: integer("videos_processed").default(0).notNull(),
    secondsTranscribed: integer("seconds_transcribed").default(0).notNull(),
});

export const usageRecordRelations = relations(usageRecords, ({ one }) => ({
    user: one(users, {
        fields: [usageRecords.userId],
        references: [users.id],
    }),
}));

export const auditLogs = pgTable("audit_logs", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }), // Can be null for system actions
    action: auditActionEnum("action").notNull(),
    targetId: text("target_id"), // e.g., ID of the video, user, or subscription
    details: jsonb("details"), // e.g., IP address, user agent, changes made
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogRelations = relations(auditLogs, ({ one }) => ({
    user: one(users, {
        fields: [auditLogs.userId],
        references: [users.id],
    }),
}));
