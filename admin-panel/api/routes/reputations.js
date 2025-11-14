const express = require('express');
const router = express.Router();
const pools = require('../src/database');

// Common WoW Classic factions with IDs
const CLASSIC_FACTIONS = [
  { id: 47, name: 'Ironforge', team: 'Alianza' },
  { id: 54, name: 'Gnomeregan Exiles', team: 'Alianza' },
  { id: 59, name: 'Thorium Brotherhood', team: 'Neutral' },
  { id: 68, name: 'Undercity', team: 'Horda' },
  { id: 69, name: 'Darnassus', team: 'Alianza' },
  { id: 72, name: 'Stormwind', team: 'Alianza' },
  { id: 76, name: 'Orgrimmar', team: 'Horda' },
  { id: 81, name: 'Thunder Bluff', team: 'Horda' },
  { id: 87, name: 'Bloodsail Buccaneers', team: 'Neutral' },
  { id: 21, name: 'Booty Bay', team: 'Neutral' },
  { id: 369, name: 'Gadgetzan', team: 'Neutral' },
  { id: 470, name: 'Ratchet', team: 'Neutral' },
  { id: 529, name: 'Argent Dawn', team: 'Neutral' },
  { id: 530, name: 'Darkspear Trolls', team: 'Horda' },
  { id: 549, name: 'Gelkis Clan Centaur', team: 'Neutral' },
  { id: 550, name: 'Magram Clan Centaur', team: 'Neutral' },
  { id: 551, name: 'Everlook', team: 'Neutral' },
  { id: 576, name: 'Timbermaw Hold', team: 'Neutral' },
  { id: 577, name: 'Everlook', team: 'Neutral' },
  { id: 589, name: 'Wintersaber Trainers', team: 'Alianza' },
  { id: 609, name: 'Cenarion Circle', team: 'Neutral' },
  { id: 729, name: 'Frostwolf Clan', team: 'Horda' },
  { id: 730, name: 'Stormpike Guard', team: 'Alianza' },
  { id: 749, name: 'Hydraxian Waterlords', team: 'Neutral' },
  { id: 809, name: 'Shen\'dralar', team: 'Neutral' },
  { id: 889, name: 'Warsong Outriders', team: 'Horda' },
  { id: 890, name: 'Silverwing Sentinels', team: 'Alianza' },
  { id: 909, name: 'Darkmoon Faire', team: 'Neutral' },
  { id: 910, name: 'Brood of Nozdormu', team: 'Neutral' },
  { id: 911, name: 'Silvermoon Remnant', team: 'Neutral' },
  { id: 922, name: 'The League of Arathor', team: 'Alianza' },
  { id: 941, name: 'The Defilers', team: 'Horda' },
  { id: 967, name: 'The Violet Eye', team: 'Neutral' },
  { id: 970, name: 'Sporeggar', team: 'Neutral' },
  { id: 1011, name: 'Lower City', team: 'Neutral' }
];

// GET /api/reputations/search - Search factions with pagination
router.get('/search', async (req, res) => {
  const { q, page = 1, limit = 50 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  try {
    let results = [...CLASSIC_FACTIONS];

    // Filter if query provided
    if (q && q.trim()) {
      // Check if query is a number (ID search) or text (name search)
      if (!isNaN(q)) {
        const factionId = parseInt(q);
        results = results.filter(faction => faction.id === factionId);
      } else {
        const searchTerm = q.toLowerCase();
        results = results.filter(faction =>
          faction.name.toLowerCase().includes(searchTerm) ||
          faction.team.toLowerCase().includes(searchTerm)
        );
      }
    }

    // Sort alphabetically by name
    results.sort((a, b) => a.name.localeCompare(b.name));

    // Pagination
    const total = results.length;
    const paginatedResults = results.slice(offset, offset + limitNum);

    res.json({
      data: paginatedResults,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total,
        totalPages: Math.ceil(total / limitNum),
        hasMore: offset + limitNum < total
      }
    });
  } catch (error) {
    console.error('Error searching factions:', error);
    res.status(500).json({ error: 'Failed to search factions' });
  }
});

// GET /api/reputations/:id - Get faction details
router.get('/:id', async (req, res) => {
  try {
    const faction = CLASSIC_FACTIONS.find(f => f.id === parseInt(req.params.id));

    if (!faction) {
      return res.status(404).json({ error: 'Faction not found' });
    }

    res.json(faction);
  } catch (error) {
    console.error('Error fetching faction:', error);
    res.status(500).json({ error: 'Failed to fetch faction' });
  }
});

module.exports = router;
