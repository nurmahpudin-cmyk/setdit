-- Baseline migration: Initial schema
-- All existing tables created outside Prisma migrate

-- Enums
CREATE TYPE "approval_action" AS ENUM ('REGISTER', 'ACTIVATE', 'DEACTIVATE', 'REJECT');
CREATE TYPE "approval_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "otp_type" AS ENUM ('REGISTRATION', 'FORGOT_PASSWORD', 'LOGIN');
CREATE TYPE "user_status" AS ENUM ('PENDING', 'VERIFIED', 'ACTIVE', 'INACTIVE', 'REJECTED');
CREATE TYPE "wa_status" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- Tables (empty placeholder - tables already exist in DB)
-- This migration is a no-op to satisfy Prisma migrate
