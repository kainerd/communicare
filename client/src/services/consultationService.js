/**
 * Consultation Service
 * Centralised API calls for visit / consultation lifecycle management.
 */
import apiClient from '../api/client';

/* ── Visit (Consultation) CRUD ── */

export const fetchVisit = (visitId) =>
  apiClient.get(`/visits/${visitId}`).then((r) => r.data.visit);

export const fetchVisitsForPatient = (patientId) =>
  apiClient.get(`/visits/patient/${patientId}`).then((r) => r.data.visits);

export const startVisit = (patientId) =>
  apiClient
    .post('/visits', { patient_id: patientId, visit_date: new Date().toISOString() })
    .then((r) => r.data.visit);

export const closeVisit = (visitId) =>
  apiClient.patch(`/visits/${visitId}/close`).then((r) => r.data);

/**
 * Wipes board_selections, speech_logs, ai_summaries for the visit
 * but leaves the visit record itself open so a new session can begin.
 */
export const clearVisitData = (visitId) =>
  apiClient.delete(`/visits/${visitId}/data`).then((r) => r.data);

/** Permanently deletes the visit and all its data. */
export const deleteVisit = (visitId) =>
  apiClient.delete(`/visits/${visitId}`).then((r) => r.data);

/* ── Board Selections ── */

export const fetchBoardSelections = (visitId) =>
  apiClient.get(`/board/visit/${visitId}`).then((r) => r.data.selections);

export const saveBoardSelections = (visitId, selections) =>
  apiClient.post(`/board/visit/${visitId}`, { selections }).then((r) => r.data);

export const clearBoardSelections = (visitId) =>
  apiClient.delete(`/board/visit/${visitId}`).then((r) => r.data);

/** Delete a single board selection entry by its ID. */
export const deleteBoardSelection = (visitId, selId) =>
  apiClient.delete(`/board/visit/${visitId}/selection/${selId}`).then((r) => r.data);

/* ── Speech Logs ── */

export const fetchSpeechLogs = (visitId) =>
  apiClient.get(`/speech/visit/${visitId}`).then((r) => r.data.logs);

/** Delete a single speech log entry by its ID. */
export const deleteSpeechLog = (visitId, logId) =>
  apiClient.delete(`/speech/visit/${visitId}/log/${logId}`).then((r) => r.data);

/* ── Patients ── */

/** Permanently delete a patient and all their consultation data. */
export const deletePatient = (patientId) =>
  apiClient.delete(`/patients/${patientId}`).then((r) => r.data);

/* ── AI Summary ── */

export const fetchSummary = (visitId) =>
  apiClient.get(`/summary/visit/${visitId}`).then((r) => r.data.summary);

export const generateSummary = (visitId) =>
  apiClient.post(`/summary/visit/${visitId}`).then((r) => r.data.summary);

/* ── Patient Report (PDF) ── */

export const fetchPatientReport = (patientId) =>
  apiClient.get(`/patients/${patientId}/report`).then((r) => r.data);
