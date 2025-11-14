const express = require('express');
const router = express.Router();
const pools = require('../src/database');

// GET /api/quests/search - Search quests
router.get('/search', async (req, res) => {
  const { q, minLevel, maxLevel } = req.query;

  try {
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

    if (q) {
      // Check if query is a number (ID search) or text (name search)
      if (!isNaN(q)) {
        query += ' AND entry = ?';
        params.push(parseInt(q));
      } else {
        query += ' AND Title LIKE ?';
        params.push(`%${q}%`);
      }
    }

    if (minLevel) {
      query += ' AND MinLevel >= ?';
      params.push(parseInt(minLevel));
    }

    if (maxLevel) {
      query += ' AND QuestLevel <= ?';
      params.push(parseInt(maxLevel));
    }

    query += ' ORDER BY Title LIMIT 100';

    const [rows] = await pools.world.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error searching quests:', error);
    // Return empty array if table doesn't exist or there's an error
    res.json([]);
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
