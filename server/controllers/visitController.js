const { createVisit, findByPatient, findById, closeVisit, findOpenVisit } = require('../models/visitModel');
const { findById: findPatient } = require('../models/patientModel');

async function startVisit(req, res, next) {
  try {
    const { patient_id } = req.body;
    if (!patient_id) return res.status(400).json({ error: 'patient_id is required' });

    const patient = await findPatient(patient_id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    if (patient.caregiver_id !== req.dbUser.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const id = await createVisit(patient_id, req.dbUser.id);
    const visit = await findById(id);
    res.status(201).json({ visit });
  } catch (err) { next(err); }
}

async function listVisits(req, res, next) {
  try {
    const patient = await findPatient(req.params.patientId);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    if (patient.caregiver_id !== req.dbUser.id && req.dbUser.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const visits = await findByPatient(req.params.patientId);
    res.json({ visits });
  } catch (err) { next(err); }
}

async function getVisit(req, res, next) {
  try {
    const visit = await findById(req.params.id);
    if (!visit) return res.status(404).json({ error: 'Visit not found' });
    res.json({ visit });
  } catch (err) { next(err); }
}

async function closeVisitHandler(req, res, next) {
  try {
    const visit = await findById(req.params.id);
    if (!visit) return res.status(404).json({ error: 'Visit not found' });
    if (visit.caregiver_id !== req.dbUser.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    await closeVisit(req.params.id);
    res.json({ message: 'Visit closed' });
  } catch (err) { next(err); }
}

module.exports = { startVisit, listVisits, getVisit, closeVisitHandler };
