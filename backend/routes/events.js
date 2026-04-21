const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');

// Get all events
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT e.*, p.full_name, p.avatar_url,
        (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id) as participant_count
      FROM events e 
      LEFT JOIN profiles p ON e.creator_id = p.id 
      ORDER BY e.event_date ASC
    `);

    res.json({ data: result.rows });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const eventResult = await query(`
      SELECT e.*, p.full_name, p.avatar_url
      FROM events e 
      LEFT JOIN profiles p ON e.creator_id = p.id 
      WHERE e.id = $1
    `, [id]);

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const participantsResult = await query(`
      SELECT ep.*, p.full_name, p.avatar_url
      FROM event_participants ep
      LEFT JOIN profiles p ON ep.user_id = p.id
      WHERE ep.event_id = $1
    `, [id]);

    res.json({ 
      data: { 
        ...eventResult.rows[0],
        participants: participantsResult.rows
      } 
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Create event (admin only)
router.post('/', async (req, res) => {
  try {
    const { creator_id, title, description, event_date, event_time, location, image_url, visibility, max_participants } = req.body;
    
    // Check if user is admin
    const profileResult = await query('SELECT role FROM profiles WHERE id = $1', [creator_id]);

    if (profileResult.rows.length === 0 || profileResult.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create events' });
    }
    
    const result = await query(
      'INSERT INTO events (id, creator_id, title, description, event_date, event_time, location, image_url, visibility, max_participants) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [uuidv4(), creator_id, title, description, event_date, event_time, location, image_url, visibility, max_participants]
    );

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update event
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, event_date, event_time, location, image_url, visibility, max_participants } = req.body;
    
    const result = await query(
      'UPDATE events SET title = $1, description = $2, event_date = $3, event_time = $4, location = $5, image_url = $6, visibility = $7, max_participants = $8, updated_at = NOW() WHERE id = $9 RETURNING *',
      [title, description, event_date, event_time, location, image_url, visibility, max_participants, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete event
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await query('DELETE FROM events WHERE id = $1', [id]);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Join event
router.post('/:id/join', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    
    await query('INSERT INTO event_participants (id, event_id, user_id) VALUES ($1, $2, $3)', [uuidv4(), id, user_id]);

    res.json({ message: 'Joined event successfully' });
  } catch (error) {
    console.error('Join event error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Leave event
router.post('/:id/leave', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    
    await query('DELETE FROM event_participants WHERE event_id = $1 AND user_id = $2', [id, user_id]);

    res.json({ message: 'Left event successfully' });
  } catch (error) {
    console.error('Leave event error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
