# Database Setup Guide for Render

## Problem
You're getting this error:
```
QueryFailedError: relation "pokemon" does not exist
```

This means the database tables haven't been created yet.

## Solution: Enable Database Synchronization (Quick Fix)

Since this is a fresh database on Render, the quickest solution is to enable TypeORM's `synchronize` feature to automatically create tables.

### Option 1: Enable Synchronize via Environment Variable (Recommended for Initial Setup)

1. **Go to your backend service on Render**
2. **Click Settings → Environment**
3. **Add a new environment variable**:
   - **Key**: `DB_SYNCHRONIZE`
   - **Value**: `true`
4. **Save Changes** (this will trigger a redeploy)
5. **Wait for deployment to complete**
6. **After tables are created, you can remove this variable** (optional, for security)

### Option 2: Keep Synchronize Enabled (Simpler but Less Secure)

If you want to keep synchronize enabled for automatic schema updates:

1. Keep `DB_SYNCHRONIZE=true` in environment variables
2. TypeORM will automatically create/update tables based on your entities
3. ⚠️ **Warning**: This can cause data loss if you change entity definitions in production

### Option 3: Create Tables Manually via Shell (Advanced)

1. **Connect to Render Shell**:
   - Go to your backend service
   - Click **"Shell"** tab
   - Wait for shell to connect

2. **Run TypeORM synchronization script**:
   ```bash
   cd server
   node -e "
   const { DataSource } = require('typeorm');
   const { User, Pokemon, FavoritePokemon, Contact, Battle } = require('./dist/entities');
   
   const AppDataSource = new DataSource({
     type: 'postgres',
     host: process.env.DB_HOST,
     port: parseInt(process.env.DB_PORT),
     username: process.env.DB_USERNAME,
     password: process.env.DB_PASSWORD,
     database: process.env.DB_DATABASE,
     entities: [User, Pokemon, FavoritePokemon, Contact, Battle],
     synchronize: true,
   });
   
   AppDataSource.initialize()
     .then(() => {
       console.log('Database synchronized successfully!');
       process.exit(0);
     })
     .catch((error) => {
       console.error('Error synchronizing database:', error);
       process.exit(1);
     });
   "
   ```

3. **Or use a simpler approach** - Create a sync script:
   - This method is more complex, Option 1 is recommended

## Recommended Approach

**For initial setup on Render**:
1. ✅ Add `DB_SYNCHRONIZE=true` environment variable
2. ✅ Let the app create tables automatically on next deploy
3. ⚠️ After first successful deployment, consider removing `DB_SYNCHRONIZE` for production safety

**Why this works**:
- The code now checks for `DB_SYNCHRONIZE` environment variable
- If set to `true`, it enables synchronize even in production
- This is safe for initial setup on a fresh database
- After tables are created, you can disable it

## Verify Tables Are Created

After deployment, check your database:
1. Go to your PostgreSQL service on Render
2. Click **"Info"** tab
3. Use the connection string to connect via psql or pgAdmin
4. Run: `\dt` to list all tables
5. You should see: `users`, `pokemon`, `favorite_pokemon`, `contacts`, `battles`

## After Initial Setup (Optional Security Step)

Once tables are created and working:

1. **Remove `DB_SYNCHRONIZE` environment variable** from Render
2. The app will continue to work (synchronize will be disabled)
3. Future schema changes should use migrations instead

## Alternative: Use Migrations (Production Best Practice)

For production environments, it's better to use migrations:

1. Generate migration locally:
   ```bash
   cd server
   npm run migration:generate -- -n InitialSchema
   ```

2. Run migration on Render:
   - Connect via shell
   - `cd server`
   - `npm run migration:run`

However, for initial setup, enabling synchronize is faster and simpler.

