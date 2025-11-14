const express = require('express');
const router = express.Router();
const pools = require('../src/database');

// GET /api/quests/search - Search quests with pagination
router.get('/search', async (req, res) => {
  const { q, minLevel, maxLevel, page = 1, limit = 50 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  try {
    // Count total for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM quest_template WHERE 1=1';
    let query = `
      SELECT
        entry as id,
        Title as title,
        QuestLevel as level,
        MinLevel as minLevel,
        Type as type,
        SuggestedPlayers as suggestedPlayers
      FROM quest_template
      WHERE 1=1
    `;
    const params = [];
    const countParams = [];

    if (q && q.trim()) {
      // Check if query is a number (ID search) or text (name search)
      if (!isNaN(q)) {
        query += ' AND entry = ?';
        countQuery += ' AND entry = ?';
        params.push(parseInt(q));
        countParams.push(parseInt(q));
      } else {
        query += ' AND Title LIKE ?';
        countQuery += ' AND Title LIKE ?';
        const searchTerm = `%${q}%`;
        params.push(searchTerm);
        countParams.push(searchTerm);
      }
    }

    if (minLevel) {
      query += ' AND MinLevel >= ?';
      countQuery += ' AND MinLevel >= ?';
      const minLvl = parseInt(minLevel);
      params.push(minLvl);
      countParams.push(minLvl);
    }

    if (maxLevel) {
      query += ' AND QuestLevel <= ?';
      countQuery += ' AND QuestLevel <= ?';
      const maxLvl = parseInt(maxLevel);
      params.push(maxLvl);
      countParams.push(maxLvl);
    }

    query += ' ORDER BY Title LIMIT ? OFFSET ?';
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
    console.error('Error searching quests:', error);
    // Return empty result if table doesn't exist or there's an error
    res.json({
      data: [],
      pagination: {
        page: 1,
        limit: limitNum,
        total: 0,
        totalPages: 0,
        hasMore: false
      }
    });
  }
});

// GET /api/quests/:id - Get quest details
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pools.world.query(
      'SELECT * FROM quest_template WHERE entry = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching quest:', error);
    res.status(500).json({ error: 'Failed to fetch quest' });
  }
});

module.exports = router;
