const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');

// Get all profiles (for simple lists)
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM profiles ORDER BY full_name ASC');
    res.json({ data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search profiles
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ data: [] });

    const result = await query(
      'SELECT id, full_name, avatar_url, profession FROM profiles WHERE full_name ILIKE $1 LIMIT 20',
      [`%${q}%`]
    );
    res.json({ data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent active profiles
router.get('/recent', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, full_name, avatar_url, profession FROM profiles ORDER BY updated_at DESC LIMIT 10'
    );
    res.json({ data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Heartbeat - update activity
router.post('/heartbeat', async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'User ID required' });
    
    await query('UPDATE profiles SET updated_at = NOW() WHERE id = $1', [user_id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Get profile by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query('SELECT * FROM profiles WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update profile
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, profession, location, age, avatar_url } = req.body;
    
    const result = await query(
      'UPDATE profiles SET full_name = $1, profession = $2, location = $3, age = $4, avatar_url = $5, updated_at = NOW() WHERE id = $6 RETURNING *',
      [full_name, profession, location, age, avatar_url, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get follow status
router.get('/:id/follow-status', async (req, res) => {
  try {
    const { id } = req.params;
    const { follower_id } = req.query;
    
    if (!follower_id) {
      return res.json({ data: { is_following: false } });
    }

    const result = await query(
      'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
      [follower_id, id]
    );

    res.json({ data: { is_following: result.rows.length > 0 } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Follow user
router.post('/:id/follow', async (req, res) => {
  try {
    const { id } = req.params;
    const { follower_id } = req.body;

    if (!follower_id || follower_id === id) {
      return res.status(400).json({ error: 'Invalid follower ID' });
    }

    // Check if already following
    const check = await query('SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2', [follower_id, id]);
    if (check.rows.length > 0) {
      return res.json({ message: 'Already followed' });
    }
    
    await query('INSERT INTO follows (id, follower_id, following_id) VALUES ($1, $2, $3)', [uuidv4(), follower_id, id]);

    // Update followers count of the person being followed
    await query('UPDATE profiles SET followers_count = followers_count + 1 WHERE id = $1', [id]);
    
    // Update following count of the person who is following
    await query('UPDATE profiles SET following_count = following_count + 1 WHERE id = $1', [follower_id]);

    res.json({ message: 'Followed successfully' });
  } catch (error) {
    console.error('Follow error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Unfollow user
router.delete('/:id/follow', async (req, res) => {
  try {
    const { id } = req.params;
    const { follower_id } = req.query;
    
    await query('DELETE FROM follows WHERE follower_id = $1 AND following_id = $2', [follower_id, id]);

    // Update followers count of the person being unfollowed
    await query('UPDATE profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = $1', [id]);
    
    // Update following count of the person who is unfollowing
    await query('UPDATE profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = $1', [follower_id]);

    res.json({ message: 'Unfollowed successfully' });
  } catch (error) {
    console.error('Unfollow error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get followers list
router.get('/:id/followers', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT p.id, p.full_name, p.avatar_url, p.profession
      FROM profiles p
      JOIN follows f ON p.id = f.follower_id
      WHERE f.following_id = $1
    `, [id]);
    res.json({ data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get following list
router.get('/:id/following', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT p.id, p.full_name, p.avatar_url, p.profession
      FROM profiles p
      JOIN follows f ON p.id = f.following_id
      WHERE f.follower_id = $1
    `, [id]);
    res.json({ data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
