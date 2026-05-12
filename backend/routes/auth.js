const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');

// Sign up
router.post('/signup', async (req, res) => {
  try {
    console.log('Signup request body:', req.body);
    const { email, password, fullName, profession, location, age } = req.body;
    
    console.log('Signup request received:', { email, password: password ? '***' : undefined, fullName, profession, location, age });
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const userId = uuidv4();
    await query(
      'INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [userId, email, passwordHash]
    );

    // Create profile (optional fields can be null)
    await query(
      'INSERT INTO profiles (id, full_name, profession, location, age) VALUES ($1, $2, $3, $4, $5)',
      [userId, fullName || null, profession || null, location || null, age || null]
    );

    res.json({ data: { id: userId, email }, message: 'User created successfully' });
  } catch (error) {
    console.error('Signup error:', error);
    if (error.code === '23505' || (error.message && error.message.includes('users_email_key'))) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }
    res.status(400).json({ error: error.message });
  }
});

// Sign in
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Get user
    const userResult = await query(
      'SELECT id, email, password_hash, must_change_password FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const user = userResult.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    // Get profile
    const profileResult = await query(
      'SELECT * FROM profiles WHERE id = $1',
      [user.id]
    );

    res.json({ 
      data: { 
        user: { 
          id: user.id, 
          email: user.email,
          must_change_password: user.must_change_password,
          profile: profileResult.rows[0]
        } 
      } 
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Change password
router.post('/change-password', async (req, res) => {
  try {
    const { user_id, new_password } = req.body;
    
    if (!user_id || !new_password) {
      return res.status(400).json({ error: 'User ID and new password are required' });
    }

    const passwordHash = await bcrypt.hash(new_password, 10);
    
    await query(
      'UPDATE users SET password_hash = $1, must_change_password = false, updated_at = NOW() WHERE id = $2',
      [passwordHash, user_id]
    );

    res.json({ success: true, message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(400).json({ error: error.message });
  }
});


// Get user
router.get('/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const userResult = await query(
      'SELECT id, email, created_at FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profileResult = await query(
      'SELECT * FROM profiles WHERE id = $1',
      [id]
    );

    res.json({ 
      data: { 
        user: userResult.rows[0],
        profile: profileResult.rows[0]
      } 
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
