import {
  pgTable, pgEnum, uuid, text, boolean,
  index
} from 'drizzle-orm/pg-core'
import { timestamptz } from './helpers.js'

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'manager', 'staff', 'driver', 'viewer'])

// profiles — mirrors auth.users
export const profiles = pgTable('profiles', {
  id:         uuid('id').primaryKey(),
  fullName:   text('full_name').notNull().default(''),
  role:       userRoleEnum('role').notNull().default('staff'),
  phone:      text('phone'),
  avatarUrl:  text('avatar_url'),
  isActive:   boolean('is_active').notNull().default(true),
  createdAt:  timestamptz('created_at').notNull().defaultNow(),
  updatedAt:  timestamptz('updated_at').notNull().defaultNow(),
}, (t) => [
  index('idx_profiles_role').on(t.role),
])
