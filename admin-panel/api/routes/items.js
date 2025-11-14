const express = require('express');
const router = express.Router();
const pools = require('../src/database');

// GET /api/items/search - Search items
router.get('/search', async (req, res) => {
  const { q, class: itemClass, quality } = req.query;

  try {
    let query = 'SELECT entry, name, Quality, ItemLevel, RequiredLevel, class FROM item_template WHERE 1=1';
    const params = [];

    if (q) {
      query += ' AND name LIKE ?';
      params.push(`%${q}%`);
    }

    if (itemClass) {
      query += ' AND class = ?';
      params.push(itemClass);
    }

    if (quality) {
      query += ' AND Quality = ?';
      params.push(quality);
    }

    query += ' ORDER BY name LIMIT 100';

    const [rows] = await pools.world.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error searching items:', error);
    res.status(500).json({ error: 'Failed to search items' });
  }
});

// GET /api/items/:id - Get item details
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pools.world.query(
      'SELECT * FROM item_template WHERE entry = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

module.exports = router;
