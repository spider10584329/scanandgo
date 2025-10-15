# API Key System Implementation Summary

## Overview
The ScanAndGo API key generation system has been updated from using hardcoded keys to a database-driven approach with enhanced security.

## Changes Made

### 1. Database Schema
**New Table: `apikey`**
```sql
CREATE TABLE `apikey` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `api_key` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `api_key` (`api_key`),
  KEY `customer_id_idx` (`customer_id`)
);
```

### 2. Frontend Changes

#### Admin API Key Page (`/admin/apikey`)
- ✅ Customer ID input field is now **read-only**
- ✅ Customer ID value automatically populated from authenticated user's token
- ✅ Users cannot manually edit the customer ID

#### Agent API Key Page (`/agent/apikey`)
- ✅ Customer ID input field is now **read-only**
- ✅ Customer ID value automatically populated from authenticated user's token
- ✅ Users cannot manually edit the customer ID

### 3. Backend API Changes

#### Generate API Key Endpoint (`/api/admin/generate-apikey`)
- ✅ Removed hardcoded array of 30 pre-generated keys
- ✅ Now uses `customer_id` from JWT token (ignores any request body parameters)
- ✅ **New Database Logic:**
  - Counts existing API keys for the customer
  - If ≥30 keys exist: Returns random existing key from database
  - If <30 keys exist: Generates new UUID, saves to database, returns new key
- ✅ Supports both admin and agent roles
- ✅ Uses raw SQL queries for database operations

#### Inventory API Endpoint (`/api/scanandgo/inventory`)
- ✅ Removed hardcoded API key validation array
- ✅ Now validates API keys against the database
- ✅ Checks that API key exists AND matches the provided customer_id
- ✅ Prevents cross-customer data access

### 4. Security Improvements
- ✅ **Customer ID derived from authenticated token** (cannot be spoofed)
- ✅ **API keys stored securely in database** with unique constraints
- ✅ **Customer-specific validation** prevents unauthorized access
- ✅ **Role-based access control** maintained for both admin and agent

## Files Modified

### Backend Files:
1. `src/app/api/admin/generate-apikey/route.ts` - Database-driven key generation
2. `src/app/api/scanandgo/inventory/route.ts` - Database API key validation
3. `prisma/schema.prisma` - Added apikey model

### Frontend Files:
1. `src/app/admin/apikey/page.tsx` - Read-only customer ID field
2. `src/app/agent/apikey/page.tsx` - Read-only customer ID field

### New Files:
1. `create_apikey_table.sql` - SQL script to create the database table
2. `test-apikey-system.mjs` - Test script for the new system

## Setup Instructions

### 1. Install Dependencies
```bash
npm install uuid @types/uuid
```

### 2. Create Database Table
Run the SQL script in your MySQL database:
```bash
mysql -u [username] -p [database] < create_apikey_table.sql
```

### 3. Test the Implementation
```bash
node test-apikey-system.mjs
```

## Key Features

### Database Logic
- **30-key limit per customer**: Ensures reasonable database size
- **UUID generation**: Cryptographically secure unique keys
- **Automatic key rotation**: Reuses existing keys when limit reached
- **Customer isolation**: Keys are tied to specific customers

### Security Features
- **Token-based customer ID**: Prevents parameter tampering
- **Database validation**: All API key checks go through database
- **Unique constraints**: Prevents duplicate API keys
- **Role-based generation**: Both admin and agent can generate keys

### User Experience
- **Read-only customer ID**: Clear indication that value is automatic
- **Seamless key generation**: No manual input required
- **Consistent behavior**: Same experience for admin and agent roles

## Testing
The system includes comprehensive testing with:
- ✅ Admin login and key generation
- ✅ Agent login and key generation  
- ✅ Inventory API access with valid keys
- ✅ Invalid key rejection
- ✅ Customer ID validation

## Notes
- Raw SQL queries used to avoid Prisma client generation issues
- Backward compatible with existing authentication system
- Maintains all existing functionality while adding database persistence
- Error handling for database connection issues
- Proper HTTP status codes for different error conditions
