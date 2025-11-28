# Data Persistence Fix - Solution Documentation

## Problem

When running the application after building or restarting, all data (user activity, uploaded files, admin panel information) gets erased because:

1. **Data directory path issue**: The data files were stored relative to the compiled code location (`dist/server/data/`), but the actual data was in `server/data/`
2. **Build process**: When building, the code moves to `dist/server/`, so it looks for data in `dist/server/data/` which doesn't exist
3. **Default data reset**: When data files aren't found, the system creates new default/empty data files, losing all previous data

## Root Cause

The original implementation used:
```typescript
const DATA_DIR = join(__dirname, "../data");
```

Where `__dirname` is the directory of the compiled code:
- **Development**: `server/routes/` → data at `server/data/` ✅
- **Production**: `dist/server/routes/` → looks for `dist/server/data/` ❌

Since data is in `server/data/`, production can't find it and creates new files.

## Solution

### 1. Created Persistent Data Directory Utility

Created `server/utils/dataPath.ts` that uses `process.cwd()` to get the project root directory, ensuring data is always stored at `server/data/` regardless of where code runs from.

### 2. Updated All Route Files

Updated all route files to import and use the persistent `DATA_DIR`:
- `server/routes/media.ts`
- `server/routes/users.ts`
- `server/routes/settings.ts`
- `server/routes/creators.ts`
- `server/routes/popup-ads.ts`

### 3. Data Location

Data is now **always** stored at: `{project_root}/server/data/`

This location:
- ✅ Persists across builds
- ✅ Works in development and production
- ✅ Same location regardless of compiled code location

## How It Works

The new `DATA_DIR` utility:
```typescript
export function getDataDirectoryAbsolute(): string {
  const projectRoot = process.cwd(); // Always project root
  return join(projectRoot, "server", "data");
}
```

This ensures:
- Data directory is always at the same location relative to project root
- Works whether running `npm run dev` or `npm start`
- Works whether code is compiled or in source form

## Important Notes

### Data Backup

**⚠️ CRITICAL**: The `server/data/` directory is in `.gitignore`, meaning data files are NOT tracked in Git. You must:

1. **Backup data files regularly**
2. **Restore data after fresh installations**
3. **Never delete the data directory** without backing it up first

### Recommended Backup Strategy

1. **Before builds/deployments**: Copy `server/data/` to a backup location
2. **Automated backups**: Set up cloud sync or automated backups
3. **Production**: Consider migrating to a proper database (PostgreSQL, MongoDB)

## Testing the Fix

After applying this fix:

1. **Verify data location**:
   ```bash
   # Should always point to server/data/ regardless of build
   ls server/data/
   ```

2. **Test persistence**:
   - Add some data (upload media, create users, etc.)
   - Stop the application
   - Run `npm run build`
   - Start the application with `npm start`
   - Verify all data is still present

3. **Check data files**:
   ```bash
   # All these files should exist and persist:
   server/data/media-database.json
   server/data/users-database.json
   server/data/creators-database.json
   server/data/popup-ads-database.json
   server/data/settings.json
   ```

## Migration Steps (If You Have Existing Data)

If you have existing data that might be in the wrong location:

1. **Check for old data location**:
   ```bash
   # Check if data exists in dist/server/data/
   ls dist/server/data/ 2>/dev/null || echo "No data in dist/"
   ```

2. **Move data to correct location** (if found):
   ```bash
   # If data exists in dist/server/data/, move it
   cp -r dist/server/data/* server/data/ 2>/dev/null
   ```

3. **Verify data files**:
   ```bash
   ls -la server/data/*.json
   ```

## Future Improvements

For production environments, consider:

1. **Database Migration**: Move from JSON files to PostgreSQL/MongoDB
2. **Automated Backups**: Set up scheduled backups
3. **Data Validation**: Add schema validation for data integrity
4. **Monitoring**: Add alerts for data file issues

## Files Changed

- ✅ `server/utils/dataPath.ts` - New utility for persistent data directory
- ✅ `server/routes/media.ts` - Updated to use persistent path
- ✅ `server/routes/users.ts` - Updated to use persistent path
- ✅ `server/routes/settings.ts` - Updated to use persistent path
- ✅ `server/routes/creators.ts` - Updated to use persistent path
- ✅ `server/routes/popup-ads.ts` - Updated to use persistent path
- ✅ `server/data/README.md` - Documentation for data directory

