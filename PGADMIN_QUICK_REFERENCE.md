# pgAdmin Quick Reference - Your Database Connection

## ⚠️ IMPORTANT: Enter Values Separately!

**DO NOT** paste the connection string into any single field. Each value goes in its own field.

## Your Exact Connection Values

When adding a new server in pgAdmin, use these values:

### General Tab
- **Name**: `Render Pokedex Database` (or any name you like)

### Connection Tab
- **Host name/address**: `dpg-d58g43uuk2gs73djkki0-a.oregon-postgres.render.com`
  - ⚠️ **ONLY this** - nothing else!
- **Port**: `5432`
- **Maintenance database**: `pokedex_kbnp`
  - ⚠️ This is a SEPARATE field from Host!
- **Username**: `pokeuser`
- **Password**: `FYfddjSnskGohhwO8lMKdo19JesX122z`
- ✅ Check "Save password" (optional, but recommended)

### SSL Tab
- **SSL mode**: `Require` (or `Prefer`)

## Common Mistakes to Avoid

❌ **WRONG** - Putting database in hostname:
```
Host: dpg-d58g43uuk2gs73djkki0-a.oregon-postgres.render.com/pokedex_kbnp
```

✅ **CORRECT** - Separate fields:
```
Host: dpg-d58g43uuk2gs73djkki0-a.oregon-postgres.render.com
Database: pokedex_kbnp
```

❌ **WRONG** - Entire connection string in host:
```
Host: postgresql://pokeuser:password@dpg-.../pokedex_kbnp
```

✅ **CORRECT** - Just the hostname:
```
Host: dpg-d58g43uuk2gs73djkki0-a.oregon-postgres.render.com
```

## Step-by-Step in pgAdmin

1. Right-click **"Servers"** → **"Register" → "Server..."**
2. **General tab**: Enter name
3. **Connection tab**: 
   - Host: `dpg-d58g43uuk2gs73djkki0-a.oregon-postgres.render.com`
   - Port: `5432`
   - Database: `pokedex_kbnp` ← Separate field!
   - Username: `pokeuser`
   - Password: `FYfddjSnskGohhwO8lMKdo19JesX122z`
4. **SSL tab**: Set mode to `Require`
5. Click **"Save"**

## If You Get "Failed to Resolve Host" Error

This means you put the database name in the Host field. Fix it:

1. Right-click your server → **Properties**
2. Go to **Connection** tab
3. **Host field**: Should be ONLY `dpg-d58g43uuk2gs73djkki0-a.oregon-postgres.render.com`
4. **Database field**: Should be `pokedex_kbnp` (in the "Maintenance database" field)
5. Click **Save**

## Connection String (for reference only)

If you need the full connection string format (for command line tools):

```
postgresql://pokeuser:FYfddjSnskGohhwO8lMKdo19JesX122z@dpg-d58g43uuk2gs73djkki0-a.oregon-postgres.render.com:5432/pokedex_kbnp?sslmode=require
```

⚠️ **But don't use this in pgAdmin** - enter values separately!


