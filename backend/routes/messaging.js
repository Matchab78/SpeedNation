const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');

// Get conversations for user
router.get('/conversations', async (req, res) => {
  try {
    const { user_id } = req.query;
    
    const result = await query(`
      SELECT c.*, 
        p1.full_name as participant1_name, p1.avatar_url as participant1_avatar,
        p2.full_name as participant2_name, p2.avatar_url as participant2_avatar,
        (
          SELECT json_build_object(
            'content', m.content,
            'created_at', m.created_at
          )
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) as last_message
      FROM conversations c
      LEFT JOIN profiles p1 ON c.participant1_id = p1.id
      LEFT JOIN profiles p2 ON c.participant2_id = p2.id
      WHERE c.participant1_id = $1 OR c.participant2_id = $1
      ORDER BY c.updated_at DESC
    `, [user_id]);

    res.json({ data: result.rows });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get messages for conversation
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT m.*, p.full_name, p.avatar_url
      FROM messages m
      LEFT JOIN profiles p ON m.sender_id = p.id
      WHERE m.conversation_id = $1 AND m.is_deleted = false
      ORDER BY m.created_at ASC
    `, [id]);

    res.json({ data: result.rows });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Create conversation
router.post('/conversations', async (req, res) => {
  try {
    const { participant1_id, participant2_id, is_group, group_name } = req.body;
    
    // Check if a private conversation already exists if not a group
    if (!is_group) {
       const existingResult = await query(`
         SELECT * FROM conversations 
         WHERE is_group = false AND (
           (participant1_id = $1 AND participant2_id = $2) OR
           (participant1_id = $2 AND participant2_id = $1)
         )
       `, [participant1_id, participant2_id]);
       
       if (existingResult.rows.length > 0) {
         return res.json({ data: existingResult.rows[0] });
       }
    }
    
    const conversationId = uuidv4();
    await query(
      'INSERT INTO conversations (id, participant1_id, participant2_id, is_group, group_name) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [conversationId, participant1_id, participant2_id, is_group || false, group_name]
    );

    // Add participants
    await query('INSERT INTO conversation_participants (id, conversation_id, user_id, is_admin) VALUES ($1, $2, $3, $4)', [uuidv4(), conversationId, participant1_id, true]);
    await query('INSERT INTO conversation_participants (id, conversation_id, user_id, is_admin) VALUES ($1, $2, $3, $4)', [uuidv4(), conversationId, participant2_id, false]);

    const result = await query('SELECT * FROM conversations WHERE id = $1', [conversationId]);

    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Send message
router.post('/messages', async (req, res) => {
  try {
    const { conversation_id, sender_id, content, message_type, file_url } = req.body;
    
    const result = await query(
      'INSERT INTO messages (id, conversation_id, sender_id, content, message_type, file_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [uuidv4(), conversation_id, sender_id, content, message_type || 'text', file_url]
    );

    // Update conversation updated_at
    await query('UPDATE conversations SET updated_at = NOW() WHERE id = $1', [conversation_id]);

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
