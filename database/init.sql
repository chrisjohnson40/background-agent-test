-- Initial database setup for Garage Inventory Management System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create database if not exists (this is handled by Docker environment variables)
-- The actual database creation is handled by the postgres Docker image

-- Grant privileges to the user
GRANT ALL PRIVILEGES ON DATABASE garage_inventory TO garage_user;

-- Set timezone
SET timezone = 'UTC';

-- Create schema for application tables
CREATE SCHEMA IF NOT EXISTS garage_inventory;

-- Grant schema privileges
GRANT ALL ON SCHEMA garage_inventory TO garage_user;
GRANT ALL ON ALL TABLES IN SCHEMA garage_inventory TO garage_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA garage_inventory TO garage_user;

-- Note: The actual table creation will be handled by Entity Framework migrations
-- This file just sets up the basic database structure and permissions