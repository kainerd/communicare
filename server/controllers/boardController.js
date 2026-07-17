const { pool } = require('../config/db');
const { findById: findVisit } = require('../models/visitModel');

async function getSelections(req, res, next) {
  try {
    const { visitId } = req.params;
    const visit = await findVisit(visitId);
    if (!visit) return res.status(404).json({ error: 'Visit not found' });

    const [rows] = await pool.query(
      'SELECT * FROM board_selections WHERE visit_id = ? ORDER BY created_at ASC',
      [visitId],
    );
    res.json({ selections: rows });
  } catch (err) { next(err); }
}

async function saveSelections(req, res, next) {
  try {
    const { visitId } = req.params;
    const visit = await findVisit(visitId);
    if (!visit) return res.status(404).json({ error: 'Visit not found' });
    if (visit.status === 'closed') return res.status(400).json({ error: 'Visit is closed' });

    const { selections } = req.body;
    // selections: [{ category, label }]
    if (!Array.isArray(selections) || selections.length === 0) {
      return res.status(400).json({ error: 'selections array is required' });
    }

    const validCategories = ['body_part', 'need', 'emotion', 'symptom', 'free_text'];
    for (const s of selections) {
      if (!validCategories.includes(s.category) || !s.label) {
        return res.status(400).json({ error: `Invalid selection: ${JSON.stringify(s)}` });
      }
    }

    const values = selections.map((s) => [visitId, s.category, s.label]);
    await pool.query(
      'INSERT INTO board_selections (visit_id, category, label) VALUES ?',
      [values],
    );

    const [rows] = await pool.query(
      'SELECT * FROM board_selections WHERE visit_id = ? ORDER BY created_at ASC',
      [visitId],
    );
    res.status(201).json({ selections: rows });
  } catch (err) { next(err); }
}

async function clearSelections(req, res, next) {
  try {
    const { visitId } = req.params;
    const visit = await findVisit(visitId);
    if (!visit) return res.status(404).json({ error: 'Visit not found' });
    if (visit.status === 'closed') return res.status(400).json({ error: 'Visit is closed' });

    await pool.query('DELETE FROM board_selections WHERE visit_id = ?', [visitId]);
    res.json({ message: 'Cleared' });
  } catch (err) { next(err); }
}

module.exports = { getSelections, saveSelections, clearSelections };
