const express = require('express');
const router = express.Router();
const pools = require('../src/database');

// Common WoW Classic spells with IDs
// These are popular spells used by GMs for common tasks
const CLASSIC_SPELLS = [
  // Mage
  { id: 133, name: 'Fireball', rank: 'Rank 1', level: 1, class: 'Mage' },
  { id: 143, name: 'Fireball', rank: 'Rank 2', level: 6, class: 'Mage' },
  { id: 145, name: 'Fireball', rank: 'Rank 3', level: 12, class: 'Mage' },
  { id: 116, name: 'Frostbolt', rank: 'Rank 1', level: 4, class: 'Mage' },
  { id: 205, name: 'Frostbolt', rank: 'Rank 2', level: 8, class: 'Mage' },
  { id: 118, name: 'Polymorph', rank: 'Rank 1', level: 8, class: 'Mage' },
  { id: 12826, name: 'Polymorph', rank: 'Rank 2', level: 20, class: 'Mage' },
  { id: 130, name: 'Slow Fall', rank: 'Rank 1', level: 12, class: 'Mage' },
  { id: 1459, name: 'Arcane Intellect', rank: 'Rank 1', level: 1, class: 'Mage' },
  { id: 7301, name: 'Frost Armor', rank: 'Rank 1', level: 1, class: 'Mage' },
  { id: 12051, name: 'Evocation', rank: 'Rank 1', level: 20, class: 'Mage' },
  { id: 2136, name: 'Fire Blast', rank: 'Rank 1', level: 6, class: 'Mage' },
  { id: 2120, name: 'Flamestrike', rank: 'Rank 1', level: 16, class: 'Mage' },
  { id: 122, name: 'Frost Nova', rank: 'Rank 1', level: 10, class: 'Mage' },
  { id: 1449, name: 'Arcane Explosion', rank: 'Rank 1', level: 14, class: 'Mage' },

  // Priest
  { id: 2050, name: 'Lesser Heal', rank: 'Rank 1', level: 1, class: 'Priest' },
  { id: 2054, name: 'Heal', rank: 'Rank 1', level: 16, class: 'Priest' },
  { id: 2060, name: 'Greater Heal', rank: 'Rank 1', level: 40, class: 'Priest' },
  { id: 2061, name: 'Flash Heal', rank: 'Rank 1', level: 20, class: 'Priest' },
  { id: 139, name: 'Renew', rank: 'Rank 1', level: 8, class: 'Priest' },
  { id: 17, name: 'Power Word: Shield', rank: 'Rank 1', level: 6, class: 'Priest' },
  { id: 589, name: 'Shadow Word: Pain', rank: 'Rank 1', level: 4, class: 'Priest' },
  { id: 585, name: 'Smite', rank: 'Rank 1', level: 1, class: 'Priest' },
  { id: 2006, name: 'Resurrection', rank: 'Rank 1', level: 10, class: 'Priest' },
  { id: 1243, name: 'Power Word: Fortitude', rank: 'Rank 1', level: 1, class: 'Priest' },
  { id: 8122, name: 'Psychic Scream', rank: 'Rank 1', level: 14, class: 'Priest' },
  { id: 453, name: 'Mind Soothe', rank: 'Rank 1', level: 20, class: 'Priest' },
  { id: 15407, name: 'Mind Flay', rank: 'Rank 1', level: 20, class: 'Priest' },

  // Warrior
  { id: 772, name: 'Rend', rank: 'Rank 1', level: 4, class: 'Warrior' },
  { id: 78, name: 'Heroic Strike', rank: 'Rank 1', level: 1, class: 'Warrior' },
  { id: 100, name: 'Charge', rank: 'Rank 1', level: 4, class: 'Warrior' },
  { id: 6673, name: 'Battle Shout', rank: 'Rank 1', level: 1, class: 'Warrior' },
  { id: 71, name: 'Defensive Stance', rank: 'Rank 1', level: 10, class: 'Warrior' },
  { id: 2457, name: 'Battle Stance', rank: 'Rank 1', level: 1, class: 'Warrior' },
  { id: 355, name: 'Taunt', rank: 'Rank 1', level: 10, class: 'Warrior' },
  { id: 871, name: 'Shield Wall', rank: 'Rank 1', level: 28, class: 'Warrior' },
  { id: 1715, name: 'Hamstring', rank: 'Rank 1', level: 8, class: 'Warrior' },
  { id: 6343, name: 'Thunder Clap', rank: 'Rank 1', level: 6, class: 'Warrior' },

  // Paladin
  { id: 635, name: 'Holy Light', rank: 'Rank 1', level: 1, class: 'Paladin' },
  { id: 19740, name: 'Blessing of Might', rank: 'Rank 1', level: 4, class: 'Paladin' },
  { id: 19834, name: 'Blessing of Kings', rank: 'Rank 1', level: 20, class: 'Paladin' },
  { id: 1022, name: 'Blessing of Protection', rank: 'Rank 1', level: 10, class: 'Paladin' },
  { id: 633, name: 'Lay on Hands', rank: 'Rank 1', level: 10, class: 'Paladin' },
  { id: 853, name: 'Hammer of Justice', rank: 'Rank 1', level: 8, class: 'Paladin' },
  { id: 20271, name: 'Judgement', rank: 'Rank 1', level: 4, class: 'Paladin' },
  { id: 465, name: 'Devotion Aura', rank: 'Rank 1', level: 1, class: 'Paladin' },
  { id: 7294, name: 'Retribution Aura', rank: 'Rank 1', level: 16, class: 'Paladin' },
  { id: 10326, name: 'Turn Evil', rank: 'Rank 1', level: 24, class: 'Paladin' },

  // Warlock
  { id: 686, name: 'Shadow Bolt', rank: 'Rank 1', level: 1, class: 'Warlock' },
  { id: 172, name: 'Corruption', rank: 'Rank 1', level: 4, class: 'Warlock' },
  { id: 980, name: 'Curse of Agony', rank: 'Rank 1', level: 8, class: 'Warlock' },
  { id: 348, name: 'Immolate', rank: 'Rank 1', level: 1, class: 'Warlock' },
  { id: 702, name: 'Curse of Weakness', rank: 'Rank 1', level: 4, class: 'Warlock' },
  { id: 5782, name: 'Fear', rank: 'Rank 1', level: 8, class: 'Warlock' },
  { id: 688, name: 'Summon Imp', rank: 'Rank 1', level: 1, class: 'Warlock' },
  { id: 697, name: 'Summon Voidwalker', rank: 'Rank 1', level: 10, class: 'Warlock' },
  { id: 1120, name: 'Drain Soul', rank: 'Rank 1', level: 10, class: 'Warlock' },
  { id: 5740, name: 'Rain of Fire', rank: 'Rank 1', level: 20, class: 'Warlock' },

  // Druid
  { id: 5185, name: 'Healing Touch', rank: 'Rank 1', level: 1, class: 'Druid' },
  { id: 8921, name: 'Moonfire', rank: 'Rank 1', level: 4, class: 'Druid' },
  { id: 5176, name: 'Wrath', rank: 'Rank 1', level: 1, class: 'Druid' },
  { id: 774, name: 'Rejuvenation', rank: 'Rank 1', level: 4, class: 'Druid' },
  { id: 339, name: 'Entangling Roots', rank: 'Rank 1', level: 8, class: 'Druid' },
  { id: 5487, name: 'Bear Form', rank: 'Rank 1', level: 10, class: 'Druid' },
  { id: 768, name: 'Cat Form', rank: 'Rank 1', level: 20, class: 'Druid' },
  { id: 467, name: 'Thorns', rank: 'Rank 1', level: 6, class: 'Druid' },
  { id: 5229, name: 'Enrage', rank: 'Rank 1', level: 12, class: 'Druid' },
  { id: 2908, name: 'Soothe Animal', rank: 'Rank 1', level: 18, class: 'Druid' },

  // Rogue
  { id: 1752, name: 'Sinister Strike', rank: 'Rank 1', level: 1, class: 'Rogue' },
  { id: 53, name: 'Backstab', rank: 'Rank 1', level: 4, class: 'Rogue' },
  { id: 2098, name: 'Eviscerate', rank: 'Rank 1', level: 1, class: 'Rogue' },
  { id: 1776, name: 'Gouge', rank: 'Rank 1', level: 6, class: 'Rogue' },
  { id: 1766, name: 'Kick', rank: 'Rank 1', level: 12, class: 'Rogue' },
  { id: 1784, name: 'Stealth', rank: 'Rank 1', level: 1, class: 'Rogue' },
  { id: 1943, name: 'Rupture', rank: 'Rank 1', level: 20, class: 'Rogue' },
  { id: 5171, name: 'Slice and Dice', rank: 'Rank 1', level: 10, class: 'Rogue' },
  { id: 2983, name: 'Sprint', rank: 'Rank 1', level: 10, class: 'Rogue' },
  { id: 1725, name: 'Distract', rank: 'Rank 1', level: 22, class: 'Rogue' },

  // Hunter
  { id: 75, name: 'Auto Shot', rank: 'Rank 1', level: 1, class: 'Hunter' },
  { id: 1978, name: 'Serpent Sting', rank: 'Rank 1', level: 4, class: 'Hunter' },
  { id: 3044, name: 'Arcane Shot', rank: 'Rank 1', level: 6, class: 'Hunter' },
  { id: 1130, name: 'Hunter\'s Mark', rank: 'Rank 1', level: 6, class: 'Hunter' },
  { id: 13163, name: 'Aspect of the Monkey', rank: 'Rank 1', level: 4, class: 'Hunter' },
  { id: 5116, name: 'Concussive Shot', rank: 'Rank 1', level: 8, class: 'Hunter' },
  { id: 1513, name: 'Scare Beast', rank: 'Rank 1', level: 14, class: 'Hunter' },
  { id: 19883, name: 'Track Humanoids', rank: 'Rank 1', level: 1, class: 'Hunter' },
  { id: 2641, name: 'Dismiss Pet', rank: 'Rank 1', level: 10, class: 'Hunter' },
  { id: 883, name: 'Call Pet', rank: 'Rank 1', level: 10, class: 'Hunter' },

  // Shaman
  { id: 331, name: 'Healing Wave', rank: 'Rank 1', level: 1, class: 'Shaman' },
  { id: 403, name: 'Lightning Bolt', rank: 'Rank 1', level: 1, class: 'Shaman' },
  { id: 8042, name: 'Earth Shock', rank: 'Rank 1', level: 4, class: 'Shaman' },
  { id: 8017, name: 'Rockbiter Weapon', rank: 'Rank 1', level: 1, class: 'Shaman' },
  { id: 324, name: 'Lightning Shield', rank: 'Rank 1', level: 8, class: 'Shaman' },
  { id: 8024, name: 'Flametongue Weapon', rank: 'Rank 1', level: 10, class: 'Shaman' },
  { id: 8050, name: 'Flame Shock', rank: 'Rank 1', level: 10, class: 'Shaman' },
  { id: 547, name: 'Water Walking', rank: 'Rank 1', level: 28, class: 'Shaman' },
  { id: 8071, name: 'Stoneskin Totem', rank: 'Rank 1', level: 4, class: 'Shaman' },
  { id: 5394, name: 'Healing Stream Totem', rank: 'Rank 1', level: 20, class: 'Shaman' },

  // Utility/Common
  { id: 6477, name: 'Opening', rank: 'Rank 1', level: 1, class: 'Utility' },
  { id: 21651, name: 'Opening - No Text', rank: 'Rank 1', level: 1, class: 'Utility' },
  { id: 22027, name: 'Remove Insignia', rank: 'Rank 1', level: 1, class: 'Utility' },
  { id: 23451, name: 'Speed', rank: 'Rank 1', level: 1, class: 'GM' },
  { id: 23452, name: 'Battleground Speed', rank: 'Rank 1', level: 1, class: 'GM' },
  { id: 23453, name: 'Battleground Heal', rank: 'Rank 1', level: 1, class: 'GM' }
];

// GET /api/spells/search - Search spells with pagination
router.get('/search', async (req, res) => {
  const { q, page = 1, limit = 50 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  try {
    let results = [...CLASSIC_SPELLS];

    // Filter if query provided
    if (q && q.trim()) {
      // Check if query is a number (ID search) or text (name search)
      if (!isNaN(q)) {
        const spellId = parseInt(q);
        results = results.filter(spell => spell.id === spellId);
      } else {
        const searchTerm = q.toLowerCase();
        results = results.filter(spell =>
          spell.name.toLowerCase().includes(searchTerm) ||
          spell.class.toLowerCase().includes(searchTerm) ||
          (spell.rank && spell.rank.toLowerCase().includes(searchTerm))
        );
      }
    }

    // Sort alphabetically by name, then by level
    results.sort((a, b) => {
      if (a.name === b.name) {
        return a.level - b.level;
      }
      return a.name.localeCompare(b.name);
    });

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
    console.error('Error searching spells:', error);
    res.status(500).json({ error: 'Failed to search spells' });
  }
});

// GET /api/spells/:id - Get spell details
router.get('/:id', async (req, res) => {
  try {
    const spell = CLASSIC_SPELLS.find(s => s.id === parseInt(req.params.id));

    if (!spell) {
      return res.status(404).json({ error: 'Spell not found' });
    }

    res.json(spell);
  } catch (error) {
    console.error('Error fetching spell:', error);
    res.status(500).json({ error: 'Failed to fetch spell' });
  }
});

module.exports = router;
