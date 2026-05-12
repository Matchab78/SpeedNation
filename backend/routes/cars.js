const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');

// Get all cars
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT c.*, p.full_name, p.avatar_url 
      FROM cars c 
      LEFT JOIN profiles p ON c.user_id = p.id 
      ORDER BY c.created_at DESC
    `);

    res.json({ data: result.rows });
  } catch (error) {
    console.error('Get cars error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get car by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT c.*, p.full_name, p.avatar_url 
      FROM cars c 
      LEFT JOIN profiles p ON c.user_id = p.id 
      WHERE c.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Car not found' });
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Get car error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Create car
router.post('/', async (req, res) => {
  try {
    const { user_id, name, brand, model, year, price_purchased, power_hp, image_url } = req.body;
    
    const result = await query(
      'INSERT INTO cars (id, user_id, name, brand, model, year, price_purchased, power_hp, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [uuidv4(), user_id, name, brand, model, year, price_purchased, power_hp, image_url]
    );

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Create car error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update car (supports partial updates via COALESCE)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, brand, model, year, price_purchased, power_hp, image_url } = req.body;
    
    const result = await query(
      `UPDATE cars SET
        name = COALESCE($1, name),
        brand = COALESCE($2, brand),
        model = COALESCE($3, model),
        year = COALESCE($4, year),
        price_purchased = COALESCE($5, price_purchased),
        power_hp = COALESCE($6, power_hp),
        image_url = COALESCE($7, image_url),
        updated_at = NOW()
      WHERE id = $8 RETURNING *`,
      [name ?? null, brand ?? null, model ?? null, year ?? null, price_purchased ?? null, power_hp ?? null, image_url ?? null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Car not found' });
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Update car error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete car
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await query('DELETE FROM cars WHERE id = $1', [id]);

    res.json({ message: 'Car deleted successfully' });
  } catch (error) {
    console.error('Delete car error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Toggle favorite
router.post('/:id/favorite', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    
    // Check if already favorited
    const existing = await query(
      'SELECT * FROM car_favorites WHERE car_id = $1 AND user_id = $2',
      [id, user_id]
    );

    if (existing.rows.length > 0) {
      // Remove favorite
      await query('DELETE FROM car_favorites WHERE car_id = $1 AND user_id = $2', [id, user_id]);
      res.json({ message: 'Favorite removed' });
    } else {
      // Add favorite
      await query('INSERT INTO car_favorites (id, car_id, user_id) VALUES ($1, $2, $3)', [uuidv4(), id, user_id]);
      res.json({ message: 'Favorite added' });
    }
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
