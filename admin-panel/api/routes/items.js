const express = require('express');
const router = express.Router();
const pools = require('../src/database');

// GET /api/items/search - Search items with pagination
router.get('/search', async (req, res) => {
  const { q, class: itemClass, quality, page = 1, limit = 50 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  try {
    // Count total for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM item_template WHERE 1=1';
    let query = 'SELECT entry, name, Quality, ItemLevel, RequiredLevel, class FROM item_template WHERE 1=1';
    const params = [];
    const countParams = [];

    if (q && q.trim()) {
      query += ' AND name LIKE ?';
      countQuery += ' AND name LIKE ?';
      const searchTerm = `%${q}%`;
      params.push(searchTerm);
      countParams.push(searchTerm);
    }

    if (itemClass) {
      query += ' AND class = ?';
      countQuery += ' AND class = ?';
      params.push(itemClass);
      countParams.push(itemClass);
    }

    if (quality) {
      query += ' AND Quality = ?';
      countQuery += ' AND Quality = ?';
      params.push(quality);
      countParams.push(quality);
    }

    query += ' ORDER BY name LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const [[{ total }]] = await pools.world.query(countQuery, countParams);
    const [rows] = await pools.world.query(query, params);

    res.json({
      data: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total,
        totalPages: Math.ceil(total / limitNum),
        hasMore: offset + limitNum < total
      }
    });
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
