# 🛡️ Safe Database Operations Guide

## After Restoring Your Backup

Follow these steps to safely connect your application to the restored database:

### 1. **Restore Your Database Backup**
```bash
# Restore your backup to MariaDB
# (Use your backup restoration method)
```

### 2. **Pull Existing Schema (SAFE)**
```bash
npm run db:pull
```
This will update your Prisma schema to match your existing database structure **without modifying the database**.

### 3. **Generate Prisma Client**
```bash
npm run db:generate
```
This regenerates the Prisma client to work with your restored database structure.

### 4. **Test Database Connection (READ-ONLY)**
```bash
npm run db:test
```
This tests the connection without making any changes.

### 5. **Initialize Data Only (SAFE)**
```bash
npm run db:init
```
This only adds missing roles and admin user **without modifying table structure**.

## 🚨 **NEVER USE THESE COMMANDS** (They modify database structure)
- ❌ `prisma db push` - Deletes tables not in schema
- ❌ `prisma migrate reset` - Completely wipes database
- ❌ `prisma db execute` - Can run destructive SQL

## ✅ **SAFE COMMANDS** (Only work with data)
- ✅ `prisma db pull` - Reads database structure
- ✅ `prisma generate` - Updates client code only
- ✅ `prisma migrate dev` - Adds new changes incrementally
- ✅ Your app's database functions (insert/update/delete records only)

## 🔧 **Database Operations Strategy**
1. **Schema Changes**: Use migrations, never `db push`
2. **Data Operations**: Use your app functions (safe)
3. **Testing**: Always test on a copy first
4. **Backups**: Always backup before any operations

## 📋 **Next Steps After Restore**
1. Run `npm run db:pull` to update schema
2. Run `npm run db:generate` to update client  
3. Run `npm run db:test` to verify connection
4. Run `npm run db:init` to add any missing default data
5. Test your application functionality

Your existing data will be preserved and only missing roles/users will be added safely.
