# Connecting pgAdmin to Render PostgreSQL Database

This guide will help you connect pgAdmin to your PostgreSQL database hosted on Render.

## Prerequisites

1. **pgAdmin installed** on your local machine
   - Download from: https://www.pgadmin.org/download/
   - Available for Windows, macOS, and Linux

2. **Database credentials from Render**
   - You'll need these from your Render PostgreSQL service

## Step 1: Get Database Connection Details from Render

1. **Log in to Render Dashboard**: https://dashboard.render.com
2. **Navigate to your PostgreSQL service** (not the backend service)
3. **Click on your PostgreSQL database** to open its details
4. **Go to the "Info" tab** - you'll see connection details here

You'll need the following information:
- **Host** (Internal Database Host or External Connection Host)
- **Port** (usually 5432)
- **Database Name**
- **Username**
- **Password** (click "Show" to reveal it)

### Important: Internal vs External Connection

Render provides two connection options:

#### Option A: External Connection (Recommended for pgAdmin)
- Use this if you want to connect from your local machine
- Look for "External Connection" section
- Host will look like: `dpg-xxxxx-a.oregon-postgres.render.com`
- Port: Usually `5432`

#### Option B: Internal Connection
- Only works from within Render's network
- Use this for connecting from your backend service on Render
- Host will look like: `dpg-xxxxx-a` (shorter hostname)

**For pgAdmin, use External Connection details.**

## Step 2: Install pgAdmin (if not already installed)

### macOS
```bash
# Using Homebrew
brew install --cask pgadmin4

# Or download from: https://www.pgadmin.org/download/pgadmin-4-macos/
```

### Windows
- Download installer from: https://www.pgadmin.org/download/pgadmin-4-windows/
- Run the installer and follow the setup wizard

### Linux
```bash
# Ubuntu/Debian
sudo apt-get install pgadmin4

# Or download from: https://www.pgadmin.org/download/pgadmin-4-linux/
```

## Step 3: Connect to Database in pgAdmin

1. **Open pgAdmin**
   - On macOS: Open from Applications or Spotlight
   - On Windows: Open from Start Menu
   - On Linux: Run `pgadmin4` from terminal

2. **Set Master Password** (first time only)
   - pgAdmin will ask you to set a master password
   - This is for securing your saved connections
   - Remember this password!

3. **Add New Server**
   - Right-click on **"Servers"** in the left panel
   - Select **"Register" → "Server..."**

4. **Fill in Connection Details**

   ⚠️ **CRITICAL**: Do NOT paste the entire connection string into any field! Enter each value separately.
   
   **For your specific database, use these exact values:**

   In the **"General" tab**:
   - **Name**: `Render Pokedex Database` (or any name you prefer)

   In the **"Connection" tab**:
   - **Host name/address**: `dpg-d58g43uuk2gs73djkki0-a.oregon-postgres.render.com`
     - ⚠️ **ONLY the hostname** - do NOT include `/pokedex_kbnp` or any path!
     - This should be JUST: `dpg-d58g43uuk2gs73djkki0-a.oregon-postgres.render.com`
   - **Port**: `5432` (enter as number, not text)
   - **Maintenance database**: `pokedex_kbnp`
     - ⚠️ This goes in a SEPARATE field, NOT in the hostname!
   - **Username**: `pokeuser`
   - **Password**: `FYfddjSnskGohhwO8lMKdo19JesX122z`
     - ⚠️ **Important**: Check "Save password" if you want pgAdmin to remember it

   In the **"SSL" tab** (Important for Render):
   - **SSL mode**: Select **"Require"** or **"Prefer"**
     - Render databases require SSL connections
   - Leave other SSL settings as default

   **Visual Guide - What NOT to do:**
   - ❌ Host: `dpg-d58g43uuk2gs73djkki0-a.oregon-postgres.render.com/pokedex_kbnp` (WRONG - includes database)
   - ❌ Host: `postgresql://pokeuser:...@dpg-...` (WRONG - entire connection string)
   
   **What TO do:**
   - ✅ Host: `dpg-d58g43uuk2gs73djkki0-a.oregon-postgres.render.com` (ONLY hostname)
   - ✅ Database: `pokedex_kbnp` (in separate "Maintenance database" field)

5. **Save Connection**
   - Click **"Save"** button
   - pgAdmin will attempt to connect

## Step 4: Verify Connection

1. **Check Connection Status**
   - If successful, you'll see your server in the left panel
   - Expand it to see: Databases → Your Database → Schemas → public → Tables

2. **View Tables**
   - Navigate to: `Servers → Render Pokedex Database → Databases → pokedex → Schemas → public → Tables`
   - You should see tables like:
     - `users`
     - `pokemon`
     - `favorite_pokemon`
     - `contacts`
     - `battles`

3. **Test Query**
   - Right-click on your database → **"Query Tool"**
   - Run a test query:
     ```sql
     SELECT COUNT(*) FROM pokemon;
     ```
   - If it returns a number, your connection is working!

## Troubleshooting

### Connection Timeout

**Problem**: Connection times out or fails to connect.

**Solutions**:
1. **Check Firewall**: Ensure your local network allows outbound connections on port 5432
2. **Verify Host**: Make sure you're using the **External Connection** hostname, not internal
3. **Check SSL Settings**: Ensure SSL mode is set to "Require" or "Prefer"
4. **Verify Credentials**: Double-check username, password, and database name

### SSL Connection Error

**Problem**: "SSL connection required" or similar SSL errors.

**Solution**:
- Go to **Connection → SSL tab**
- Set **SSL mode** to **"Require"**
- Save and reconnect

### Authentication Failed

**Problem**: "Password authentication failed" error.

**Solutions**:
1. **Verify Password**: Make sure you copied the password correctly from Render
2. **Reset Password**: In Render dashboard, you can reset the database password
3. **Check Username**: Ensure username matches exactly (case-sensitive)

### Host Not Found / Failed to Resolve Host

**Problem**: `failed to resolve host 'dpg-xxxxx-a.oregon-postgres.render.com/pokedex_kbnp'` or similar errors.

**Cause**: You've included the database name in the Host field!

**Solution**: 
1. The **Host** field should ONLY contain the hostname:
   - ✅ Correct: `dpg-d58g43uuk2gs73djkki0-a.oregon-postgres.render.com`
   - ❌ Wrong: `dpg-d58g43uuk2gs73djkki0-a.oregon-postgres.render.com/pokedex_kbnp`
   - ❌ Wrong: `postgresql://pokeuser:...@dpg-...`

2. The **database name** (`pokedex_kbnp`) goes in the **"Maintenance database"** field, NOT in the Host field.

3. **Step-by-step fix**:
   - Open your server connection in pgAdmin
   - Right-click → Properties
   - Go to "Connection" tab
   - **Host**: Remove everything after `.com` - should be just: `dpg-d58g43uuk2gs73djkki0-a.oregon-postgres.render.com`
   - **Maintenance database**: Should be `pokedex_kbnp` (in its own field)
   - Click Save

### Other Host Resolution Issues

**Problem**: "Could not resolve hostname" error (without database name in host).

**Solutions**:
1. **Use External Host**: Make sure you're using the external connection hostname
2. **Check Internet**: Ensure you have internet connectivity
3. **DNS Issues**: Try using the IP address if available (Render doesn't always provide this)
4. **Verify Hostname**: Double-check the hostname in Render dashboard (Info tab)

### IDNA Codec Error: "label too long"

**Problem**: `idna' codec can't encode characters in position 0-80: label too long`

**Cause**: This error occurs when:
1. The connection string is missing the port number (`:5432`)
2. The connection string format is incorrect
3. The entire connection string is being treated as a hostname

**Solution**: Your connection string must include the port number and proper format:

❌ **Incorrect** (missing port):
```
postgresql://pokeuser:password@dpg-d58g43uuk2gs73djkki0-a.oregon-postgres.render.com/pokedex_kbnp
```

✅ **Correct** (with port and SSL):
```
postgresql://pokeuser:password@dpg-d58g43uuk2gs73djkki0-a.oregon-postgres.render.com:5432/pokedex_kbnp?sslmode=require
```

**For pgAdmin**: Don't use the connection string directly. Instead, enter the values separately:
- **Host**: `dpg-d58g43uuk2gs73djkki0-a.oregon-postgres.render.com`
- **Port**: `5432`
- **Database**: `pokedex_kbnp`
- **Username**: `pokeuser`
- **Password**: `FYfddjSnskGohhwO8lMKdo19JesX122z`
- **SSL Mode**: `Require`

**For command line (psql)**: Use the corrected connection string:
```bash
psql "postgresql://pokeuser:FYfddjSnskGohhwO8lMKdo19JesX122z@dpg-d58g43uuk2gs73djkki0-a.oregon-postgres.render.com:5432/pokedex_kbnp?sslmode=require"
```

## Connection String Format

If you need the connection string format for reference:

```
postgresql://username:password@host:port/database?sslmode=require
```

**Important**: Always include the port number (`:5432`) in the connection string!

Example:
```
postgresql://pokedex_user:your_password@dpg-xxxxx-a.oregon-postgres.render.com:5432/pokedex?sslmode=require
```

**Common Mistake**: Missing port number
- ❌ `postgresql://user:pass@host/database` (missing `:5432`)
- ✅ `postgresql://user:pass@host:5432/database` (correct)

**Your specific connection string should be**:
```
postgresql://pokeuser:FYfddjSnskGohhwO8lMKdo19JesX122z@dpg-d58g43uuk2gs73djkki0-a.oregon-postgres.render.com:5432/pokedex_kbnp?sslmode=require
```

Note: Added `:5432` after the hostname and `?sslmode=require` at the end.

## Security Best Practices

1. **Don't Share Credentials**: Keep your database credentials secure
2. **Use SSL**: Always use SSL connections (required by Render)
3. **Limit Access**: Only connect from trusted networks
4. **Change Default Password**: If you haven't already, change the default database password
5. **Use Environment Variables**: Never commit credentials to version control

## Quick Reference: Render Database Info Location

1. Render Dashboard → Your PostgreSQL Service
2. Click **"Info"** tab
3. Look for:
   - **Internal Database Host**: For Render services
   - **External Connection**: For local tools like pgAdmin
   - **Database**: Database name
   - **User**: Username
   - **Password**: Click "Show" to reveal

## Alternative: Using psql Command Line

If you prefer command line, you can also connect using `psql`:

```bash
psql "postgresql://username:password@host:port/database?sslmode=require"
```

Or with individual parameters:
```bash
psql -h dpg-xxxxx-a.oregon-postgres.render.com \
     -p 5432 \
     -U your_username \
     -d pokedex \
     --set=sslmode=require
```

## Next Steps

Once connected, you can:
- ✅ View and edit table data
- ✅ Run SQL queries
- ✅ Export/import data
- ✅ Monitor database performance
- ✅ Create backups
- ✅ Manage database schema

## Need Help?

If you're still having issues:
1. Check Render's documentation: https://render.com/docs/databases
2. Verify your database service is running on Render
3. Check Render service logs for any database errors
4. Ensure your IP isn't blocked (Render free tier doesn't have IP restrictions)

