const express = require('express');
const router = express.Router();
const pools = require('../src/database');

// GET /api/reputations/search - Search factions
router.get('/search', async (req, res) => {
  const { q } = req.query;

  try {
    let query = `
      SELECT
        id,
        name,
        reputationIndex,
        team
      FROM faction_dbc
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

    // Only show factions that are visible to players (have a reputation index)
    query += ' AND reputationIndex >= 0';
    query += ' ORDER BY name LIMIT 100';

    const [rows] = await pools.world.query(query, params);

    // Map team values to readable names
    const factions = rows.map(row => ({
      ...row,
      team: row.team === 0 ? 'Horda' : row.team === 1 ? 'Alianza' : 'Neutral'
    }));

    res.json(factions);
  } catch (error) {
    console.error('Error searching factions:', error);
    res.status(500).json({ error: 'Failed to search factions' });
  }
});

// GET /api/reputations/:id - Get faction details
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pools.world.query(
      'SELECT * FROM faction_dbc WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Faction not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching faction:', error);
    res.status(500).json({ error: 'Failed to fetch faction' });
  }
});

module.exports = router;
