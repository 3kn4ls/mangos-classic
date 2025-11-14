const express = require('express');
const router = express.Router();
const pools = require('../src/database');

// GET /api/spells/search - Search spells
router.get('/search', async (req, res) => {
  const { q } = req.query;

  try {
    let query = `
      SELECT
        id,
        spellName0 as name,
        rank1 as rank,
        spellLevel as level,
        baseLevel
      FROM spell_template
      WHERE 1=1
    `;
    const params = [];

    if (q) {
      // Check if query is a number (ID search) or text (name search)
      if (!isNaN(q)) {
        query += ' AND id = ?';
        params.push(parseInt(q));
      } else {
        query += ' AND spellName0 LIKE ?';
        params.push(`%${q}%`);
      }
    }

    query += ' ORDER BY spellName0, spellLevel LIMIT 100';

    const [rows] = await pools.world.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error searching spells:', error);
    // Return empty array if table doesn't exist
    res.json([]);
  }
});

// GET /api/spells/:id - Get spell details
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pools.world.query(
      'SELECT * FROM spell_template WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Spell not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching spell:', error);
    res.status(500).json({ error: 'Failed to fetch spell' });
  }
});

module.exports = router;
