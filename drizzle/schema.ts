import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * User-submitted climbing gyms table.
 * Stores gym submissions from users for community-driven gym database.
 */
export const userSubmittedGyms = mysqlTable("user_submitted_gyms", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  district: varchar("district", { length: 100 }),
  address: text("address").notNull(),
  lat: varchar("lat", { length: 20 }), // Store as string to avoid precision issues
  lng: varchar("lng", { length: 20 }),
  type: mysqlEnum("type", ["bouldering", "lead", "mixed"]).notNull(),
  priceFrom: int("priceFrom"),
  hoursText: text("hoursText"),
  tags: text("tags"), // JSON stored as text
  coverImageUrl: text("coverImageUrl"),
  phone: varchar("phone", { length: 50 }),
  website: varchar("website", { length: 500 }),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSubmittedGym = typeof userSubmittedGyms.$inferSelect;
export type InsertUserSubmittedGym = typeof userSubmittedGyms.$inferInsert;

/**
 * User feedback table.
 * Stores user feedback, bug reports, and feature requests.
 */
export const userFeedback = mysqlTable("user_feedback", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // Nullable for anonymous feedback
  email: varchar("email", { length: 320 }),
  category: mysqlEnum("category", ["bug", "feature_request", "improvement", "other"]).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  appVersion: varchar("appVersion", { length: 50 }),
  deviceInfo: text("deviceInfo"),
  status: mysqlEnum("status", ["new", "in_progress", "resolved", "closed"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserFeedback = typeof userFeedback.$inferSelect;
export type InsertUserFeedback = typeof userFeedback.$inferInsert;
