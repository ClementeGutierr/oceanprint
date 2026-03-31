const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

function updateUserLevel(userId) {
  const user = db.prepare('SELECT points FROM users WHERE id = ?').get(userId);
  let level = 'Plancton';
  if (user.points >= 1000) level = 'Ballena Azul';
  else if (user.points >= 600) level = 'Mantarraya';
  else if (user.points >= 300) level = 'Tortuga Marina';
  else if (user.points >= 100) level = 'Caballito de Mar';
  db.prepare('UPDATE users SET level = ? WHERE id = ?').run(level, userId);
}

// Get all quizzes (without correct answer)
router.get('/', authenticateToken, (req, res) => {
  const quizzes = db.prepare(`
    SELECT id, question, option_a, option_b, option_c, option_d, category, points
    FROM quizzes
    ORDER BY id
  `).all();
  res.json(quizzes);
});

// Get random quiz
router.get('/random', authenticateToken, (req, res) => {
  const quiz = db.prepare(`
    SELECT id, question, option_a, option_b, option_c, option_d, category, points
    FROM quizzes
    ORDER BY RANDOM()
    LIMIT 1
  `).get();
  res.json(quiz);
});

// Answer a quiz question
router.post('/:id/answer', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { answer } = req.body;

    if (!answer) {
      return res.status(400).json({ error: 'Respuesta requerida' });
    }

    const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz no encontrado' });
    }

    const isCorrect = quiz.correct_answer.toUpperCase() === answer.toUpperCase();
    let pointsEarned = 0;

    if (isCorrect) {
      pointsEarned = quiz.points;
      db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(pointsEarned, req.user.id);
      updateUserLevel(req.user.id);

      // Complete any 'educacion' mission that requires answering this specific quiz — award points only if newly completed
      const linkedMission = db.prepare(
        "SELECT id, points FROM missions WHERE quiz_id = ? AND category = 'educacion'"
      ).get(parseInt(id));
      if (linkedMission) {
        const r = db.prepare('INSERT OR IGNORE INTO user_missions (user_id, mission_id) VALUES (?, ?)').run(req.user.id, linkedMission.id);
        if (r.changes > 0) {
          db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(linkedMission.points, req.user.id);
          updateUserLevel(req.user.id);
        }
      }
    }

    const user = db.prepare('SELECT points, level FROM users WHERE id = ?').get(req.user.id);

    res.json({
      correct: isCorrect,
      correct_answer: quiz.correct_answer,
      explanation: quiz.explanation,
      points_earned: pointsEarned,
      total_points: user.points,
      level: user.level,
    });
  } catch (error) {
    console.error('Quiz answer error:', error);
    res.status(500).json({ error: 'Error procesando respuesta' });
  }
});

module.exports = router;
