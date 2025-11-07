const express = require('express');
const router = express.Router();
const pools = require('../database');

// GET /api/server/stats - Get server statistics
router.get('/stats', async (req, res) => {
  try {
    // Total accounts
    const [accountCount] = await pools.realmd.query('SELECT COUNT(*) as count FROM account');

    // Total characters
    const [charCount] = await pools.characters.query('SELECT COUNT(*) as count FROM characters');

    // Average level
    const [avgLevel] = await pools.characters.query('SELECT AVG(level) as avg FROM characters');

    // Highest level
    const [maxLevel] = await pools.characters.query('SELECT MAX(level) as max FROM characters');

    // Online players (this would need to check running server, for now return 0)
    const onlinePlayers = 0;

    // Realm info
    const [realms] = await pools.realmd.query('SELECT * FROM realmlist');

    res.json({
      accounts: accountCount[0].count,
      characters: charCount[0].count,
      averageLevel: Math.round(avgLevel[0].avg) || 0,
      maxLevel: maxLevel[0].max || 0,
      onlinePlayers: onlinePlayers,
      realms: realms
    });
  } catch (error) {
    console.error('Error fetching server stats:', error);
    res.status(500).json({ error: 'Failed to fetch server stats' });
  }
});

// GET /api/server/realms - Get realm list
router.get('/realms', async (req, res) => {
  try {
    const [realms] = await pools.realmd.query('SELECT * FROM realmlist');
    res.json(realms);
  } catch (error) {
    console.error('Error fetching realms:', error);
    res.status(500).json({ error: 'Failed to fetch realms' });
  }
});

// PUT /api/server/realms/:id - Update realm
router.put('/realms/:id', async (req, res) => {
  const { name, address, port, icon, timezone, allowedSecurityLevel } = req.body;

  try {
    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (address) {
      updates.push('address = ?');
      values.push(address);
    }
    if (port) {
      updates.push('port = ?');
      values.push(port);
    }
    if (icon !== undefined) {
      updates.push('icon = ?');
      values.push(icon);
    }
    if (timezone !== undefined) {
      updates.push('timezone = ?');
      values.push(timezone);
    }
    if (allowedSecurityLevel !== undefined) {
      updates.push('allowedSecurityLevel = ?');
      values.push(allowedSecurityLevel);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);

    await pools.realmd.query(
      `UPDATE realmlist SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ message: 'Realm updated successfully' });
  } catch (error) {
    console.error('Error updating realm:', error);
    res.status(500).json({ error: 'Failed to update realm' });
  }
});

module.exports = router;
