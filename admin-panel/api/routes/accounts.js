const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const pools = require('../src/database');

// Helper function to generate WoW password hash
function generatePasswordHash(username, password) {
  const hash = crypto.createHash('sha1');
  hash.update(`${username.toUpperCase()}:${password.toUpperCase()}`);
  return hash.digest('hex').toUpperCase();
}

// GET /api/accounts - List all accounts
router.get('/', async (req, res) => {
  try {
    const [rows] = await pools.realmd.query(
      'SELECT id, username, email, joindate, last_login, locked, gmlevel FROM account ORDER BY id DESC LIMIT 100'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// GET /api/accounts/:id - Get account details
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pools.realmd.query(
      'SELECT id, username, email, joindate, last_login, locked, gmlevel, expansion FROM account WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Get characters for this account
    const [characters] = await pools.characters.query(
      'SELECT guid, name, race, class, level FROM characters WHERE account = ?',
      [req.params.id]
    );

    res.json({
      account: rows[0],
      characters: characters
    });
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({ error: 'Failed to fetch account' });
  }
});

// POST /api/accounts - Create new account
router.post('/', async (req, res) => {
  const { username, password, email, gmlevel } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // Check if username already exists
    const [existing] = await pools.realmd.query(
      'SELECT id FROM account WHERE username = ?',
      [username]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Generate password hash
    const sha_pass_hash = generatePasswordHash(username, password);

    // Insert new account
    const [result] = await pools.realmd.query(
      'INSERT INTO account (username, sha_pass_hash, email, gmlevel, joindate) VALUES (?, ?, ?, ?, NOW())',
      [username, sha_pass_hash, email || '', gmlevel || 0]
    );

    res.status(201).json({
      message: 'Account created successfully',
      id: result.insertId,
      username: username
    });
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// PUT /api/accounts/:id - Update account
router.put('/:id', async (req, res) => {
  const { email, gmlevel, locked } = req.body;

  try {
    await pools.realmd.query(
      'UPDATE account SET email = ?, gmlevel = ?, locked = ? WHERE id = ?',
      [email, gmlevel, locked, req.params.id]
    );

    res.json({ message: 'Account updated successfully' });
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ error: 'Failed to update account' });
  }
});

// POST /api/accounts/:id/reset-password - Reset password
router.post('/:id/reset-password', async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ error: 'New password is required' });
  }

  try {
    // Get username
    const [account] = await pools.realmd.query(
      'SELECT username FROM account WHERE id = ?',
      [req.params.id]
    );

    if (account.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Generate new hash
    const sha_pass_hash = generatePasswordHash(account[0].username, newPassword);

    // Update password
    await pools.realmd.query(
      'UPDATE account SET sha_pass_hash = ? WHERE id = ?',
      [sha_pass_hash, req.params.id]
    );

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// DELETE /api/accounts/:id - Delete account (soft delete - ban)
router.delete('/:id', async (req, res) => {
  try {
    // Ban the account instead of deleting
    await pools.realmd.query(
      'INSERT INTO account_banned (id, bandate, unbandate, bannedby, banreason, active) VALUES (?, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()+315360000, ?, ?, 1)',
      [req.params.id, 'Admin Panel', 'Account deleted via admin panel']
    );

    res.json({ message: 'Account banned successfully' });
  } catch (error) {
    console.error('Error banning account:', error);
    res.status(500).json({ error: 'Failed to ban account' });
  }
});

module.exports = router;
