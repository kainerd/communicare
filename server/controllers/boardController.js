const { pool } = require('../config/db');
const { findById: findVisit } = require('../models/visitModel');

// Shared helper — verifies visit exists AND belongs to this caregiver
async function requireVisitOwner(visitId, userId) {
  const visit = await findVisit(visitId);
  if (!visit) return { error: 'Visit not found', status: 404 };
  if (visit.status === 'closed') return { error: 'Visit is closed', status: 400 };
  // Security: block cross-caregiver writes
  if (visit.caregiver_id !== userId) return { error: 'Access denied', status: 403 };
  return { visit };
}

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
    const { error, status } = await requireVisitOwner(visitId, req.dbUser.id);
    if (error) return res.status(status).json({ error });

    const { selections } = req.body;
    if (!Array.isArray(selections) || selections.length === 0) {
      return res.status(400).json({ error: 'selections array is required' });
    }

    const validCategories = ['body_part', 'need', 'emotion', 'symptom', 'free_text'];
    for (const s of selections) {
      if (!validCategories.includes(s.category) || !s.label) {
        return res.status(400).json({ error: `Invalid selection: ${JSON.stringify(s)}` });
      }
      // Matches the label column width (VARCHAR(500)) and the free-text
      // input's maxLength in the UI — reject rather than let MySQL
      // silently truncate/error on an oversized value.
      if (s.label.length > 500) {
        return res.status(400).json({ error: 'label must be 500 characters or fewer' });
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
    const { error, status } = await requireVisitOwner(visitId, req.dbUser.id);
    if (error) return res.status(status).json({ error });

    await pool.query('DELETE FROM board_selections WHERE visit_id = ?', [visitId]);
    res.json({ message: 'Cleared' });
  } catch (err) { next(err); }
}

/**
 * DELETE /api/board/visit/:visitId/selection/:selId
 * Remove a single saved board entry.
 * Ownership is verified by joining to visits.
 */
async function deleteSelection(req, res, next) {
  try {
    const { visitId, selId } = req.params;

    // JOIN to visits to verify ownership + get status in one query
    const [rows] = await pool.query(
      `SELECT bs.id, v.caregiver_id, v.status
       FROM board_selections bs
       JOIN visits v ON v.id = bs.visit_id
       WHERE bs.id = ? AND bs.visit_id = ?`,
      [selId, visitId],
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Selection not found' });
    const sel = rows[0];
    if (sel.caregiver_id !== req.dbUser.id) return res.status(403).json({ error: 'Access denied' });
    if (sel.status === 'closed') return res.status(400).json({ error: 'Visit is closed' });

    // WHERE bs.id = ? — deletes exactly one row by primary key; parameterized, no injection risk
    await pool.query('DELETE FROM board_selections WHERE id = ?', [selId]);
    res.json({ message: 'Selection deleted' });
  } catch (err) { next(err); }
}

module.exports = { getSelections, saveSelections, clearSelections, deleteSelection };
