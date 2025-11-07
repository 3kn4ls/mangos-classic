# MaNGOS Classic - Web Admin Panel

Complete web-based administration interface for managing your MaNGOS Classic server.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Web Interface Guide](#web-interface-guide)
- [Security Considerations](#security-considerations)
- [GM Command Integration](#gm-command-integration)
- [Troubleshooting](#troubleshooting)

---

## Overview

The MaNGOS Classic Admin Panel provides a modern web interface for server administration tasks:

- **Account Management**: Create, edit, delete, and manage player accounts
- **Character Administration**: View and modify character data (level, money, items)
- **Item Distribution**: Search items and distribute them to players
- **Server Statistics**: Real-time server metrics and status
- **GM Commands**: Execute game master commands from the browser
- **Realm Configuration**: Manage realm settings

---

## Architecture

The admin panel consists of three main components:

```
┌─────────────────┐
│   Web Browser   │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│  Nginx (Web)    │  ← Serves static HTML/CSS/JS
│  Port 80        │  ← Reverse proxy for API
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Node.js API     │  ← REST API (Express)
│ Port 3000       │  ← Business logic
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ MySQL Database  │  ← classicmangos
│ Port 3306       │  ← classiccharacters
                     ← classicrealmd
```

### Components

1. **Frontend (admin-panel/web/)**
   - Static HTML/CSS/JavaScript single-page application
   - Nginx web server with reverse proxy configuration
   - Responsive design for desktop and mobile

2. **Backend API (admin-panel/api/)**
   - Node.js with Express framework
   - Direct MySQL connection pools for performance
   - RESTful API design

3. **Database**
   - Connects to existing MaNGOS databases
   - Read/write access to realmd, characters, and world databases

---

## Features

### Account Management
- Create new accounts with proper password hashing (SHA1, WoW format)
- List all accounts with registration dates
- Edit account details (email, expansion level)
- Reset passwords
- Ban/unban accounts
- Delete accounts

### Character Management
- View all characters with account information
- Modify character level
- Adjust character money (copper, silver, gold)
- Add honor points
- Queue items for delivery
- Delete characters

### Item Distribution
- Search items by name
- Filter by item class and quality
- View detailed item information
- Queue items for in-game mail delivery

### Server Statistics
- Total accounts count
- Total characters count
- Average character level
- Realm information
- Online status (planned)

### GM Commands
- Browse common GM commands
- Execute commands via console (requires RA/SOAP integration)
- Command history and logging

---

## Prerequisites

Before deploying the admin panel, ensure you have:

- **MaNGOS Classic server** deployed in Kubernetes (k3s)
- **MySQL database** accessible from the cluster
- **Database credentials** stored in Kubernetes secrets
- **kubectl** configured for cluster access
- **Docker** for building images

---

## Installation

### Step 1: Build Docker Images

The admin panel uses two Docker images:

```bash
# Build API image
cd admin-panel/api
docker build -t mangos-classic/admin-api:latest .

# Build Web image
cd ../web
docker build -t mangos-classic/admin-web:latest .
```

### Step 2: Import Images to k3s (if using k3s)

```bash
# Import API image
docker save mangos-classic/admin-api:latest | sudo k3s ctr images import -

# Import Web image
docker save mangos-classic/admin-web:latest | sudo k3s ctr images import -
```

### Step 3: Deploy to Kubernetes

Use the automated deployment script:

```bash
chmod +x deploy-admin-panel.sh
./deploy-admin-panel.sh
```

Or deploy manually:

```bash
# Deploy API
kubectl apply -f kubernetes/admin-panel/api-deployment.yaml

# Deploy Web interface
kubectl apply -f kubernetes/admin-panel/web-deployment.yaml

# Configure Ingress (optional)
kubectl apply -f kubernetes/admin-panel/ingress.yaml
```

### Step 4: Verify Deployment

Wait for pods to be ready:

```bash
kubectl wait --for=condition=Available deployment/admin-api -n mangos-classic --timeout=120s
kubectl wait --for=condition=Available deployment/admin-web -n mangos-classic --timeout=120s
```

Check pod status:

```bash
kubectl get pods -n mangos-classic | grep admin
```

### Step 5: Access the Panel

Get your node IP:

```bash
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
echo "Admin Panel URL: http://$NODE_IP:30080"
```

Access the panel in your browser:
```
http://<NODE_IP>:30080
```

---

## Configuration

### Database Connection

The API connects to MySQL using environment variables defined in `kubernetes/admin-panel/api-deployment.yaml`:

```yaml
env:
- name: DB_HOST
  value: "mysql-service"
- name: DB_PORT
  value: "3306"
- name: DB_USER
  valueFrom:
    secretKeyRef:
      name: database-secrets
      key: mysql-user
- name: DB_PASSWORD
  valueFrom:
    secretKeyRef:
      name: database-secrets
      key: mysql-password
- name: REALMD_DB
  value: "classicrealmd"
- name: CHARACTERS_DB
  value: "classiccharacters"
- name: WORLD_DB
  value: "classicmangos"
```

### Database Secrets

Ensure your database secrets are created:

```bash
kubectl create secret generic database-secrets \
  --from-literal=mysql-user=mangos \
  --from-literal=mysql-password=mangos \
  --from-literal=mysql-root-password=mangos \
  -n mangos-classic
```

### CORS Configuration

By default, CORS is set to `*` (allow all origins). For production, update this in the deployment:

```yaml
- name: CORS_ORIGIN
  value: "https://your-domain.com"
```

### Custom Domain (Optional)

To use a custom domain with Ingress:

1. Update `kubernetes/admin-panel/ingress.yaml`:
```yaml
spec:
  rules:
  - host: admin.mangos.yourdomain.com
```

2. Add DNS record pointing to your cluster IP

3. Apply the updated Ingress:
```bash
kubectl apply -f kubernetes/admin-panel/ingress.yaml
```

---

## API Reference

Base URL: `http://<NODE_IP>:30080/api`

### Accounts Endpoints

#### GET /api/accounts
List all accounts.

**Response:**
```json
[
  {
    "id": 1,
    "username": "PLAYER1",
    "email": "player1@example.com",
    "joindate": "2025-01-01 00:00:00",
    "expansion": 0,
    "locked": 0
  }
]
```

#### POST /api/accounts
Create a new account.

**Request:**
```json
{
  "username": "NEWPLAYER",
  "password": "SecurePassword123",
  "email": "newplayer@example.com",
  "expansion": 0
}
```

**Response:**
```json
{
  "success": true,
  "accountId": 42
}
```

#### PUT /api/accounts/:id
Update an existing account.

**Request:**
```json
{
  "email": "updated@example.com",
  "expansion": 1
}
```

#### DELETE /api/accounts/:id
Delete an account.

**Response:**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

#### POST /api/accounts/:id/reset-password
Reset account password.

**Request:**
```json
{
  "newPassword": "NewSecurePassword123"
}
```

#### POST /api/accounts/:id/ban
Ban an account.

**Request:**
```json
{
  "reason": "Cheating",
  "bannedBy": "GM-Admin"
}
```

### Characters Endpoints

#### GET /api/characters
List all characters.

**Response:**
```json
[
  {
    "guid": 1,
    "name": "Warrior",
    "account": 1,
    "username": "PLAYER1",
    "level": 60,
    "race": 1,
    "class": 1,
    "money": 1000000,
    "totaltime": 360000,
    "online": 0
  }
]
```

#### PUT /api/characters/:guid
Update character data.

**Request:**
```json
{
  "level": 60,
  "money": 10000000,
  "totalHonorPoints": 5000
}
```

#### POST /api/characters/:guid/give-item
Queue an item for delivery.

**Request:**
```json
{
  "itemId": 19019,
  "quantity": 1,
  "subject": "GM Gift",
  "body": "Enjoy your new item!"
}
```

#### DELETE /api/characters/:guid
Delete a character.

### Items Endpoints

#### GET /api/items/search
Search for items.

**Query Parameters:**
- `name`: Item name (partial match)
- `class`: Item class ID
- `quality`: Item quality (0-7)

**Example:**
```
GET /api/items/search?name=sword&quality=4
```

**Response:**
```json
[
  {
    "entry": 19019,
    "name": "Thunderfury, Blessed Blade of the Windseeker",
    "Quality": 5,
    "ItemLevel": 80,
    "class": 2,
    "subclass": 7
  }
]
```

#### GET /api/items/:id
Get detailed item information.

**Response:**
```json
{
  "entry": 19019,
  "name": "Thunderfury, Blessed Blade of the Windseeker",
  "description": "...",
  "Quality": 5,
  "ItemLevel": 80,
  "RequiredLevel": 60,
  "class": 2,
  "subclass": 7,
  "InventoryType": 17
}
```

### Server Endpoints

#### GET /api/server/stats
Get server statistics.

**Response:**
```json
{
  "totalAccounts": 150,
  "totalCharacters": 423,
  "avgLevel": 42.5
}
```

#### GET /api/server/realms
Get realm information.

**Response:**
```json
[
  {
    "id": 1,
    "name": "MaNGOS Classic",
    "address": "192.168.1.100",
    "port": 8085,
    "realmflags": 0,
    "timezone": 1,
    "allowedSecurityLevel": 0
  }
]
```

### Commands Endpoints

#### GET /api/commands
Get list of common GM commands.

**Response:**
```json
[
  {
    "command": ".send items #playername #itemid #count",
    "description": "Send items to a player via mail"
  }
]
```

#### POST /api/commands/execute
Execute a GM command (requires RA/SOAP integration).

**Request:**
```json
{
  "command": ".server info"
}
```

---

## Web Interface Guide

### Dashboard

The dashboard displays:
- Total accounts count
- Total characters count
- Average character level
- Quick action buttons

### Account Management

**Creating an Account:**
1. Click "Accounts" tab
2. Click "Create Account" button
3. Fill in:
   - Username (uppercase automatically)
   - Password
   - Email
   - Expansion (0 = Classic, 1 = TBC)
4. Click "Create"

**Editing an Account:**
1. Find the account in the table
2. Click "Edit" button
3. Modify email or expansion
4. Click "Save"

**Resetting Password:**
1. Click "Reset Password" on the account
2. Enter new password
3. Click "Reset"

**Banning an Account:**
1. Click "Ban" on the account
2. Enter ban reason
3. Click "Ban Account"

### Character Management

**Viewing Characters:**
- All characters are listed with account information
- Use the search box to filter by name or account

**Editing Character:**
1. Click "Edit" on the character
2. Modify:
   - Level (1-60)
   - Money (in copper)
   - Honor points
3. Click "Save"

**Giving Items:**
1. Click "Give Item" on the character
2. Enter item ID
3. Specify quantity
4. Add mail subject and body
5. Click "Send"

### Item Search

**Searching Items:**
1. Click "Items" tab
2. Enter search criteria:
   - Item name (partial match)
   - Item class (optional)
   - Item quality (optional)
3. Click "Search"

**Item Quality Colors:**
- Gray: Poor (0)
- White: Common (1)
- Green: Uncommon (2)
- Blue: Rare (3)
- Purple: Epic (4)
- Orange: Legendary (5)

### GM Commands

**Using Command Console:**
1. Click "Commands" tab
2. Select a command from the list or type your own
3. Click "Execute"
4. View output in the console area

**Common Commands:**
- `.server info` - Server information
- `.send items #player #itemid #count` - Send items
- `.levelup #count` - Increase level
- `.modify money #amount` - Modify money

---

## Security Considerations

### Current Security Status

**WARNING**: The current implementation is designed for development and testing. It lacks critical security features required for production use.

### Missing Security Features

1. **No Authentication**: Currently open access to anyone who can reach the URL
2. **No Authorization**: No role-based access control
3. **No HTTPS**: Data transmitted in plain text
4. **CORS Wide Open**: Allows requests from any origin
5. **No Rate Limiting**: Vulnerable to abuse
6. **No Audit Logging**: No tracking of admin actions

### Production Hardening (Required)

#### 1. Add Authentication

Implement user authentication using JWT tokens:

```javascript
// Example authentication middleware
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// Apply to all routes
app.use('/api', authenticateToken);
```

#### 2. Enable HTTPS/TLS

Update Ingress to use TLS:

```yaml
spec:
  tls:
  - hosts:
    - admin.mangos.yourdomain.com
    secretName: admin-panel-tls
```

Install cert-manager for automatic certificates:

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

#### 3. Restrict CORS

Update API deployment:

```yaml
- name: CORS_ORIGIN
  value: "https://admin.mangos.yourdomain.com"
```

#### 4. Add Rate Limiting

Use express-rate-limit:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

#### 5. Implement Audit Logging

Log all admin actions to a separate table:

```sql
CREATE TABLE admin_audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_user VARCHAR(50),
  action VARCHAR(100),
  target_type VARCHAR(50),
  target_id INT,
  details TEXT,
  ip_address VARCHAR(45),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 6. Network Security

Use NetworkPolicy to restrict access:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: admin-panel-policy
  namespace: mangos-classic
spec:
  podSelector:
    matchLabels:
      component: admin-panel
  policyTypes:
  - Ingress
  ingress:
  - from:
    - ipBlock:
        cidr: 10.0.0.0/8  # Only internal network
```

#### 7. Environment-Specific Configuration

Never expose the admin panel on production servers directly to the internet. Use:

- VPN access for administrators
- IP whitelisting
- Bastion host/jump server
- Private cluster access only

---

## GM Command Integration

The current implementation logs commands but doesn't execute them on the game server. To enable actual command execution, you need to integrate with MaNGOS's Remote Access (RA) protocol.

### Remote Access (RA) Protocol

MaNGOS supports remote administration through the RA protocol.

#### Step 1: Enable RA in mangosd.conf

Edit your `mangosd.conf`:

```conf
###############################################
# REMOTE ACCESS
###############################################
Ra.Enable = 1
Ra.IP = 0.0.0.0
Ra.Port = 3443
Ra.MinLevel = 3
```

#### Step 2: Create RA Account

Connect to the MySQL database:

```sql
USE classicrealmd;

INSERT INTO account (username, sha_pass_hash, gmlevel, email, joindate)
VALUES ('RA_ADMIN', SHA1(CONCAT(UPPER('RA_ADMIN'), ':', UPPER('your_password'))), 3, '', NOW());
```

#### Step 3: Update API to Use RA

Install a Telnet client for Node.js:

```bash
npm install telnet-client
```

Update `admin-panel/api/routes/commands.js`:

```javascript
const Telnet = require('telnet-client');

async function executeCommand(command) {
  const connection = new Telnet();

  const params = {
    host: process.env.MANGOSD_RA_HOST || 'mangosd-service',
    port: process.env.MANGOSD_RA_PORT || 3443,
    timeout: 5000
  };

  try {
    await connection.connect(params);

    // Wait for username prompt
    await connection.send('RA_ADMIN\n');

    // Wait for password prompt
    await connection.send('your_password\n');

    // Send command
    const response = await connection.send(command + '\n');

    await connection.end();

    return { success: true, output: response };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Update POST /execute endpoint
router.post('/execute', async (req, res) => {
  const { command } = req.body;

  if (!command) {
    return res.status(400).json({ error: 'Command is required' });
  }

  try {
    const result = await executeCommand(command);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### Step 4: Update Kubernetes Deployment

Add RA configuration to API deployment:

```yaml
env:
- name: MANGOSD_RA_HOST
  value: "mangosd-service"
- name: MANGOSD_RA_PORT
  value: "3443"
- name: RA_USERNAME
  valueFrom:
    secretKeyRef:
      name: ra-credentials
      key: username
- name: RA_PASSWORD
  valueFrom:
    secretKeyRef:
      name: ra-credentials
      key: password
```

Create RA credentials secret:

```bash
kubectl create secret generic ra-credentials \
  --from-literal=username=RA_ADMIN \
  --from-literal=password=your_password \
  -n mangos-classic
```

#### Step 5: Expose RA Port

Update mangosd deployment to expose port 3443:

```yaml
ports:
- containerPort: 3443
  name: ra
  protocol: TCP
```

Create service for RA:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: mangosd-ra-service
  namespace: mangos-classic
spec:
  selector:
    app: mangosd
  ports:
  - port: 3443
    targetPort: 3443
    protocol: TCP
    name: ra
  type: ClusterIP
```

### Alternative: SOAP Protocol

MaNGOS also supports SOAP for remote commands.

Enable in `mangosd.conf`:

```conf
SOAP.Enabled = 1
SOAP.IP = 0.0.0.0
SOAP.Port = 7878
```

SOAP requires authentication and is more secure for production use.

---

## Troubleshooting

### Admin Panel Not Accessible

**Problem**: Cannot access admin panel at `http://<NODE_IP>:30080`

**Solutions**:

1. Check pod status:
```bash
kubectl get pods -n mangos-classic | grep admin
```

2. Check service:
```bash
kubectl get svc -n mangos-classic | grep admin-web
```

3. Verify NodePort is 30080:
```bash
kubectl describe svc admin-web-service -n mangos-classic
```

4. Check firewall rules:
```bash
sudo ufw status
sudo ufw allow 30080/tcp
```

### API Connection Errors

**Problem**: "Failed to fetch" or connection errors in browser console

**Solutions**:

1. Check API pod logs:
```bash
kubectl logs -n mangos-classic deployment/admin-api
```

2. Verify API is running:
```bash
kubectl get pods -n mangos-classic -l app=admin-api
```

3. Test API directly:
```bash
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
curl http://$NODE_IP:30080/api/server/stats
```

### Database Connection Errors

**Problem**: "ER_ACCESS_DENIED_ERROR" or "ECONNREFUSED"

**Solutions**:

1. Verify database secrets:
```bash
kubectl get secret database-secrets -n mangos-classic -o yaml
```

2. Check database service:
```bash
kubectl get svc mysql-service -n mangos-classic
```

3. Test database connection from API pod:
```bash
kubectl exec -it deployment/admin-api -n mangos-classic -- sh
mysql -h mysql-service -u mangos -p
```

4. Verify database names in deployment match your actual databases

### Authentication Errors

**Problem**: "SHA1 hash mismatch" when logging in game

**Solutions**:

The password hashing is case-sensitive and must use WoW format:

```javascript
// Correct format
SHA1(UPPER(username) + ':' + UPPER(password))

// Example: username "player1", password "test123"
SHA1("PLAYER1:TEST123")
```

Verify hash manually:

```bash
echo -n "PLAYER1:TEST123" | sha1sum
```

### Item Delivery Not Working

**Problem**: Items not appearing in in-game mailbox

**Solutions**:

The current implementation queues items but doesn't send mail automatically. You need to:

1. Implement mail_items table inserts
2. Or use RA commands: `.send items #player #itemid #count`

Example mail implementation:

```sql
INSERT INTO mail (messageType, stationery, sender, receiver, subject, body, has_items)
VALUES (0, 41, 0, @character_guid, 'GM Gift', 'Enjoy!', 1);

SET @mail_id = LAST_INSERT_ID();

INSERT INTO mail_items (mail_id, item_guid, receiver)
VALUES (@mail_id, @item_guid, @character_guid);
```

### GM Commands Not Executing

**Problem**: Commands show in log but nothing happens in game

**Solution**:

This is expected. The current implementation only logs commands. You must:

1. Follow the [GM Command Integration](#gm-command-integration) section
2. Enable RA protocol on mangosd
3. Implement telnet/SOAP client in the API

### Performance Issues

**Problem**: Slow response times or timeouts

**Solutions**:

1. Increase API resources:
```yaml
resources:
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

2. Add database connection pooling (already implemented):
```javascript
const pool = mysql.createPool({
  connectionLimit: 10,
  // ...
});
```

3. Add Redis caching for frequently accessed data

4. Scale API horizontally:
```bash
kubectl scale deployment admin-api --replicas=4 -n mangos-classic
```

### CORS Errors in Browser

**Problem**: "Access-Control-Allow-Origin" errors

**Solutions**:

1. Verify CORS_ORIGIN environment variable:
```bash
kubectl describe deployment admin-api -n mangos-classic | grep CORS
```

2. For development, use `*`:
```yaml
- name: CORS_ORIGIN
  value: "*"
```

3. For production, specify your domain:
```yaml
- name: CORS_ORIGIN
  value: "https://admin.mangos.yourdomain.com"
```

---

## Additional Resources

- [MaNGOS Documentation](https://github.com/cmangos/mangos-classic/wiki)
- [Remote Access Protocol](https://github.com/cmangos/mangos-classic/blob/master/doc/RemoteAdmin.md)
- [Database Schema](https://github.com/cmangos/mangos-classic/tree/master/sql)
- [WoW Item Database](https://classic.wowhead.com/)

---

## Support

For issues specific to this admin panel:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review API logs: `kubectl logs -n mangos-classic deployment/admin-api`
3. Review web logs: `kubectl logs -n mangos-classic deployment/admin-web`

For MaNGOS server issues:
- [MaNGOS GitHub Issues](https://github.com/cmangos/mangos-classic/issues)
- [MaNGOS Discord](https://discord.gg/fPxMjHS8xs)

---

## License

This admin panel is provided as-is for use with MaNGOS Classic servers. MaNGOS is licensed under GPL v2.
