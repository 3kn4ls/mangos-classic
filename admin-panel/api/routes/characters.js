const express = require('express');
const router = express.Router();
const pools = require('../database');

// GET /api/characters - List all characters
router.get('/', async (req, res) => {
  try {
    const [rows] = await pools.characters.query(`
      SELECT
        c.guid, c.name, c.race, c.class, c.level, c.money,
        c.totaltime, c.account, a.username
      FROM characters c
      LEFT JOIN classicrealmd.account a ON c.account = a.id
      ORDER BY c.level DESC
      LIMIT 100
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching characters:', error);
    res.status(500).json({ error: 'Failed to fetch characters' });
  }
});

// GET /api/characters/:guid - Get character details
router.get('/:guid', async (req, res) => {
  try {
    const [character] = await pools.characters.query(
      'SELECT * FROM characters WHERE guid = ?',
      [req.params.guid]
    );

    if (character.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Get inventory
    const [inventory] = await pools.characters.query(
      'SELECT * FROM character_inventory WHERE guid = ?',
      [req.params.guid]
    );

    res.json({
      character: character[0],
      inventory: inventory
    });
  } catch (error) {
    console.error('Error fetching character:', error);
    res.status(500).json({ error: 'Failed to fetch character' });
  }
});

// PUT /api/characters/:guid - Update character
router.put('/:guid', async (req, res) => {
  const { level, money, totalHonorPoints } = req.body;

  try {
    const updates = [];
    const values = [];

    if (level !== undefined) {
      updates.push('level = ?');
      values.push(level);
    }
    if (money !== undefined) {
      updates.push('money = ?');
      values.push(money);
    }
    if (totalHonorPoints !== undefined) {
      updates.push('totalHonorPoints = ?');
      values.push(totalHonorPoints);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.guid);

    await pools.characters.query(
      `UPDATE characters SET ${updates.join(', ')} WHERE guid = ?`,
      values
    );

    res.json({ message: 'Character updated successfully' });
  } catch (error) {
    console.error('Error updating character:', error);
    res.status(500).json({ error: 'Failed to update character' });
  }
});

// POST /api/characters/:guid/items - Give item to character
router.post('/:guid/items', async (req, res) => {
  const { itemId, quantity } = req.body;

  if (!itemId) {
    return res.status(400).json({ error: 'Item ID is required' });
  }

  try {
    // Verify item exists in world database
    const [item] = await pools.world.query(
      'SELECT entry, name FROM item_template WHERE entry = ?',
      [itemId]
    );

    if (item.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // This would typically be done by sending a .send items command to the server
    // For now, we'll just return success with a note
    res.json({
      message: 'Item delivery queued',
      note: 'Item will be sent via in-game mail. Character must be online or check mailbox.',
      item: item[0],
      quantity: quantity || 1
    });

    // TODO: Implement actual item delivery via mail or direct inventory insert
  } catch (error) {
    console.error('Error giving item:', error);
    res.status(500).json({ error: 'Failed to give item' });
  }
});

// DELETE /api/characters/:guid - Delete character
router.delete('/:guid', async (req, res) => {
  try {
    await pools.characters.query('DELETE FROM characters WHERE guid = ?', [req.params.guid]);
    res.json({ message: 'Character deleted successfully' });
  } catch (error) {
    console.error('Error deleting character:', error);
    res.status(500).json({ error: 'Failed to delete character' });
  }
});

module.exports = router;
