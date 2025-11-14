const express = require('express');
const router = express.Router();
const pools = require('../src/database');

// GET /api/skills/search - Search skills
router.get('/search', async (req, res) => {
  const { q } = req.query;

  try {
    let query = `
      SELECT
        id,
        name,
        categoryId as category
      FROM skill_line_dbc
      WHERE 1=1
    `;
    const params = [];

    if (q) {
      // Check if query is a number (ID search) or text (name search)
      if (!isNaN(q)) {
        query += ' AND id = ?';
        params.push(parseInt(q));
      } else {
        query += ' AND name LIKE ?';
        params.push(`%${q}%`);
      }
    }

    query += ' ORDER BY name LIMIT 100';

    const [rows] = await pools.world.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error searching skills:', error);
    res.status(500).json({ error: 'Failed to search skills' });
  }
});

// GET /api/skills/:id - Get skill details
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pools.world.query(
      'SELECT * FROM skill_line_dbc WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching skill:', error);
    res.status(500).json({ error: 'Failed to fetch skill' });
  }
});

module.exports = router;
