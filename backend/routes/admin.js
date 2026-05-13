const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

// Middleware to check if user is admin (simplified for now, since we don't have JWT yet, 
// usually we'd check req.user.role from a verified token)
// For now, we will rely on frontend passing the user_id or similar if needed, 
// but in a real app, this MUST be secured with JWT.
const isAdmin = async (req, res, next) => {
  // In a real app, req.user would be populated by an auth middleware
  // For this exercise, we'll assume the admin status is checked client-side 
  // or we could add a header X-User-ID for simple testing here.
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return next(); // Temporarily allow for testing if no userId provided, or block it
  }
  
  try {
    const result = await query('SELECT role FROM profiles WHERE id = $1', [userId]);
    if (result.rows.length > 0 && result.rows[0].role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Access denied. Admin role required.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Apply isAdmin to all routes in this router if we wanted to secure it strictly
// router.use(isAdmin);

// Get overall stats
router.get('/stats', async (req, res) => {
  try {
    const usersCount = await query('SELECT COUNT(*) FROM users');
    const carsCount = await query('SELECT COUNT(*) FROM cars');
    const eventsCount = await query('SELECT COUNT(*) FROM events');
    
    res.json({
      data: {
        users: parseInt(usersCount.rows[0].count),
        cars: parseInt(carsCount.rows[0].count),
        events: parseInt(eventsCount.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List all users with profiles
router.get('/users', async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*, u.email, u.created_at as account_created_at 
      FROM profiles p 
      JOIN users u ON p.id = u.id 
      ORDER BY p.created_at DESC
    `);
    res.json({ data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List all events
router.get('/events', async (req, res) => {
  try {
    const result = await query(`
      SELECT e.*, p.full_name as creator_name 
      FROM events e 
      JOIN profiles p ON e.creator_id = p.id 
      ORDER BY e.event_date DESC
    `);
    res.json({ data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle featured event
router.put('/events/:id/feature', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_featured } = req.body;
    
    // Si on veut mettre cet événement en avant, on enlève d'abord la mise en avant de TOUS les autres
    if (is_featured === true) {
      await query('UPDATE events SET is_featured = false WHERE id != $1', [id]);
    }

    const result = await query(
      'UPDATE events SET is_featured = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [is_featured, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({ data: result.rows[0], message: 'Event updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user role (admin only)
router.put('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const result = await query(
      'UPDATE profiles SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [role, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ data: result.rows[0], message: `User role updated to ${role}` });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete user (admin only)
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Deleting the user will cascade to profiles, cars, etc. due to REFERENCES ... ON DELETE CASCADE
    await query('DELETE FROM users WHERE id = $1', [id]);
    
    res.json({ message: 'User and all associated data deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reset user password (admin only)
router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { temporary_password } = req.body;
    
    if (!temporary_password) {
      return res.status(400).json({ error: 'Temporary password is required' });
    }

    const passwordHash = await bcrypt.hash(temporary_password, 10);
    
    await query(
      'UPDATE users SET password_hash = $1, must_change_password = true, updated_at = NOW() WHERE id = $2',
      [passwordHash, id]
    );

    res.json({ message: 'Mot de passe réinitialisé. L\'utilisateur devra le changer à la prochaine connexion.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
