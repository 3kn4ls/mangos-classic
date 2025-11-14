# Deployment Instructions - Admin Panel

## Problem Fixed

The API routes were not loading due to incorrect database import paths. All routes have been fixed and improved:

- ✅ Fixed database import paths (`../database` → `../src/database`)
- ✅ Added static data for Skills (43 skills) and Reputations (35 factions)
- ✅ Fixed Spells and Quests to use correct MaNGOS table columns
- ✅ Improved error handling

## 🚨 REQUIRED: Restart API Service

After pulling these changes, you **MUST restart the API service** for the new routes to load.

### Option 1: Using Kubernetes (if deployed with k8s)

```bash
# Restart the API deployment
kubectl rollout restart deployment/admin-panel-api -n cmangos

# Or delete the pod to force recreation
kubectl delete pod -l app=admin-panel-api -n cmangos

# Check the status
kubectl get pods -n cmangos -w
```

### Option 2: Using Docker

```bash
# If using docker-compose
cd /path/to/mangos-classic/admin-panel
docker-compose restart api

# Or rebuild and restart
docker-compose up -d --build api
```

### Option 3: Using PM2 (if running on bare metal)

```bash
# Restart the API process
pm2 restart mangos-admin-api

# Or reload with zero-downtime
pm2 reload mangos-admin-api

# Check logs
pm2 logs mangos-admin-api
```

### Option 4: Manual restart

```bash
# Stop the current process (Ctrl+C or kill PID)
# Then start again
cd /path/to/mangos-classic/admin-panel/api
npm start
```

## Verify the Fix

After restarting, test the endpoints:

```bash
# Test skills endpoint
curl http://localhost:3000/api/skills/search?q=sword

# Test reputations endpoint
curl http://localhost:3000/api/reputations/search?q=stormwind

# Test spells endpoint
curl http://localhost:3000/api/spells/search?q=fire

# Test quests endpoint
curl http://localhost:3000/api/quests/search?q=lost

# Test accounts endpoint (this was also broken)
curl http://localhost:3000/api/accounts
```

## What Changed

### Database Imports
All route files now correctly import the database pools:
```javascript
// Before (BROKEN)
const pools = require('../database');

// After (FIXED)
const pools = require('../src/database');
```

### Skills Route
Now uses static WoW Classic data with 43 skills including:
- Weapons (Swords, Axes, Bows, Guns, etc.)
- Professions (Tailoring, Blacksmithing, Alchemy, etc.)
- Secondary (First Aid, Cooking, Fishing)
- Languages (Common, Orcish, Gutterspeak)

### Reputations Route
Now uses static WoW Classic faction data with 35 factions including:
- Major Cities (Stormwind, Orgrimmar, Ironforge, Undercity, etc.)
- Neutral Factions (Argent Dawn, Cenarion Circle, Thorium Brotherhood, etc.)
- PvP Factions (Frostwolf Clan, Stormpike Guard, etc.)

### Spells Route
Uses correct MaNGOS table columns:
- `spellName0` for spell name
- `rank1` for spell rank
- `spellLevel` for spell level
- Returns empty array if table doesn't exist (graceful degradation)

### Quests Route
Uses standard `quest_template` table with:
- `entry` as id
- `Title` as title
- `QuestLevel` and `MinLevel`
- Returns empty array if table doesn't exist (graceful degradation)

## Expected Results

After restarting, all these features should work:

1. ✅ Skills browser with autocomplete
2. ✅ Spells browser with cast/learn commands
3. ✅ Reputations browser with faction IDs
4. ✅ Quests browser with quest IDs
5. ✅ Accounts listing (previously broken)
6. ✅ Mobile responsive menu
7. ✅ PWA functionality

## Troubleshooting

### Still getting 404 errors?
- Make sure you pulled the latest changes
- Verify the API service actually restarted (check logs)
- Check that the routes are loaded: `ls -la admin-panel/api/routes/`

### Getting database connection errors?
- Verify database credentials in `.env` or environment variables
- Check that MySQL service is running
- Test connection: `mysql -h mysql-service -u mangos -p`

### Spells or Quests return empty array?
- This is expected if your database doesn't have `spell_template` or `quest_template` tables
- MaNGOS Classic versions may use different table names
- Check your database schema: `SHOW TABLES LIKE '%spell%';`

## Need Help?

Check the logs:
```bash
# Kubernetes
kubectl logs -f deployment/admin-panel-api -n cmangos

# Docker
docker logs -f admin-panel-api

# PM2
pm2 logs mangos-admin-api --lines 100

# Direct
tail -f /var/log/mangos-admin-api.log
```
