const express = require('express');
const router = express.Router();
const pools = require('../src/database');

// Common WoW Classic skills with IDs
const CLASSIC_SKILLS = [
  { id: 43, name: 'Swords', category: 'Weapon' },
  { id: 44, name: 'Axes', category: 'Weapon' },
  { id: 45, name: 'Bows', category: 'Weapon' },
  { id: 46, name: 'Guns', category: 'Weapon' },
  { id: 54, name: 'Maces', category: 'Weapon' },
  { id: 55, name: 'Two-Handed Swords', category: 'Weapon' },
  { id: 95, name: 'Defense', category: 'Class' },
  { id: 98, name: 'Language: Common', category: 'Language' },
  { id: 101, name: 'Dwarven Racial', category: 'Racial' },
  { id: 109, name: 'Tailoring', category: 'Profession' },
  { id: 111, name: 'Blacksmithing', category: 'Profession' },
  { id: 129, name: 'First Aid', category: 'Secondary' },
  { id: 136, name: 'Staves', category: 'Weapon' },
  { id: 137, name: 'Language: Orcish', category: 'Language' },
  { id: 162, name: 'Unarmed', category: 'Weapon' },
  { id: 164, name: 'Two-Handed Maces', category: 'Weapon' },
  { id: 165, name: 'Leatherworking', category: 'Profession' },
  { id: 171, name: 'Alchemy', category: 'Profession' },
  { id: 172, name: 'Two-Handed Axes', category: 'Weapon' },
  { id: 173, name: 'Daggers', category: 'Weapon' },
  { id: 176, name: 'Thrown', category: 'Weapon' },
  { id: 182, name: 'Herbalism', category: 'Profession' },
  { id: 186, name: 'Mining', category: 'Profession' },
  { id: 197, name: 'Cooking', category: 'Secondary' },
  { id: 202, name: 'Engineering', category: 'Profession' },
  { id: 226, name: 'Crossbows', category: 'Weapon' },
  { id: 228, name: 'Wands', category: 'Weapon' },
  { id: 237, name: 'Polearms', category: 'Weapon' },
  { id: 261, name: 'Fist Weapons', category: 'Weapon' },
  { id: 293, name: 'Plate Mail', category: 'Armor' },
  { id: 333, name: 'Enchanting', category: 'Profession' },
  { id: 356, name: 'Fishing', category: 'Secondary' },
  { id: 415, name: 'Riding', category: 'Secondary' },
  { id: 433, name: 'Shield', category: 'Armor' },
  { id: 473, name: 'Feral Combat', category: 'Class' },
  { id: 554, name: 'Skinning', category: 'Profession' },
  { id: 593, name: 'Mail', category: 'Armor' },
  { id: 594, name: 'Leather', category: 'Armor' },
  { id: 613, name: 'Discipline', category: 'Class' },
  { id: 673, name: 'Language: Gutterspeak', category: 'Language' }
];

// GET /api/skills/search - Search skills
router.get('/search', async (req, res) => {
  const { q } = req.query;

  try {
    let results = CLASSIC_SKILLS;

    if (q) {
      // Check if query is a number (ID search) or text (name search)
      if (!isNaN(q)) {
        const skillId = parseInt(q);
        results = CLASSIC_SKILLS.filter(skill => skill.id === skillId);
      } else {
        const searchTerm = q.toLowerCase();
        results = CLASSIC_SKILLS.filter(skill =>
          skill.name.toLowerCase().includes(searchTerm) ||
          skill.category.toLowerCase().includes(searchTerm)
        );
      }
    }

    res.json(results.slice(0, 50));
  } catch (error) {
    console.error('Error searching skills:', error);
    res.status(500).json({ error: 'Failed to search skills' });
  }
});

// GET /api/skills/:id - Get skill details
router.get('/:id', async (req, res) => {
  try {
    const skill = CLASSIC_SKILLS.find(s => s.id === parseInt(req.params.id));

    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    res.json(skill);
  } catch (error) {
    console.error('Error fetching skill:', error);
    res.status(500).json({ error: 'Failed to fetch skill' });
  }
});

module.exports = router;
