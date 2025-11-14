const express = require('express');
const router = express.Router();
const pools = require('../src/database');

// POST /api/commands/execute - Execute GM command
router.post('/execute', async (req, res) => {
  const { command, characterName } = req.body;

  if (!command) {
    return res.status(400).json({ error: 'Command is required' });
  }

  // For security, we'll log the command but not actually execute it directly
  // In a real implementation, this would use a SOAP interface or RA (Remote Access)

  try {
    // Log the command
    console.log(`GM Command requested: ${command} for character: ${characterName || 'N/A'}`);

    // Return mock response
    res.json({
      message: 'Command queued for execution',
      note: 'Commands are executed via Remote Access protocol. Ensure RA is enabled on the server.',
      command: command,
      characterName: characterName
    });

    // TODO: Implement actual command execution via RA or SOAP
  } catch (error) {
    console.error('Error executing command:', error);
    res.status(500).json({ error: 'Failed to execute command' });
  }
});

// GET /api/commands/available - Get list of available commands
router.get('/available', async (req, res) => {
  try {
    const [commands] = await pools.world.query('SELECT name, help FROM command');
    res.json(commands);
  } catch (error) {
    console.error('Error fetching commands:', error);
    res.status(500).json({ error: 'Failed to fetch commands' });
  }
});

// Common commands helper
router.get('/common', (req, res) => {
  res.json([
    { name: 'send items', description: 'Send item to character', syntax: '.send items <character> <itemId> [count]' },
    { name: 'send money', description: 'Send money to character', syntax: '.send money <character> <amount>' },
    { name: 'levelup', description: 'Increase character level', syntax: '.levelup [count]' },
    { name: 'modify hp', description: 'Modify character HP', syntax: '.modify hp <value>' },
    { name: 'modify mana', description: 'Modify character mana', syntax: '.modify mana <value>' },
    { name: 'modify speed', description: 'Modify character speed', syntax: '.modify speed <value>' },
    { name: 'revive', description: 'Revive character', syntax: '.revive' },
    { name: 'additem', description: 'Add item to inventory', syntax: '.additem <itemId> [count]' },
    { name: 'learn', description: 'Learn spell', syntax: '.learn <spellId>' },
    { name: 'unlearn', description: 'Unlearn spell', syntax: '.unlearn <spellId>' },
    { name: 'modify money', description: 'Modify money', syntax: '.modify money <copper>' },
    { name: 'maxskill', description: 'Max all skills', syntax: '.maxskill' },
    { name: 'setskill', description: 'Set skill level', syntax: '.setskill <skill> <level> <max>' }
  ]);
});

module.exports = router;
