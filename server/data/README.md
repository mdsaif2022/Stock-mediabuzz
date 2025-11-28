# Data Directory

This directory contains all persistent application data stored as JSON files.

## Important: Data Persistence

**⚠️ CRITICAL**: This directory and its contents are **NOT** tracked in Git (see `.gitignore`). 
Your data files must be backed up separately to prevent data loss.

## Data Files

This directory contains the following database files:

- `media-database.json` - All uploaded media files
- `users-database.json` - User accounts and profiles
- `creators-database.json` - Creator applications and profiles
- `popup-ads-database.json` - Pop-up advertisement configurations
- `settings.json` - Application settings (payment, branding, general)

## Backup Instructions

### Manual Backup

1. **Before deploying or running builds**, copy this entire directory to a safe location:
   ```bash
   # Windows
   xcopy server\data backup\data /E /I
   
   # Mac/Linux
   cp -r server/data backup/data
   ```

2. **After deployment or build**, verify your data files are still present in `server/data/`

### Automated Backup

Consider setting up automated backups:

1. **Cloud Backup**: Use cloud storage (Dropbox, Google Drive, OneDrive) to sync this directory
2. **Git LFS**: For development, consider using Git LFS for data files
3. **Database Migration**: For production, consider migrating to a proper database (PostgreSQL, MongoDB, etc.)

## Data Location

The data directory is now stored at a **fixed location** relative to the project root:
- Path: `server/data/` (always relative to project root)
- This ensures data persists across builds and deployments

## Production Deployment

When deploying to production:

1. **Ensure data directory exists** on the server
2. **Restore data files** from your backup
3. **Set proper permissions** (read/write for Node.js process)
4. **Configure backups** for production data

## Migration to Database (Recommended for Production)

For production environments, consider migrating from JSON files to a proper database:
- PostgreSQL (recommended)
- MongoDB
- SQLite (for smaller deployments)

This provides better:
- Data integrity
- Concurrent access
- Backup and recovery
- Performance

