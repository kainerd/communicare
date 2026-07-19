import axios from 'axios';

// In production VITE_API_URL is set to the Railway backend URL.
// In development the Vite proxy forwards /api → localhost:5000, so baseURL stays relative.
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const apiClient = axios.create({
  baseURL,
  withCredentials: true,
});

// Global session-expiry handling.
//
// Previously, if the JWT expired (8h sessions) or was invalidated (e.g. the
// caregiver's account got disabled while logged in), every API call would
// start returning 401 "Invalid or expired token" — but nothing handled that
// centrally. Each page's own catch block dealt with it differently (some
// showed a generic alert, many just silently swallowed the error), so the
// caregiver was left staring at a broken/empty screen with no indication
// they needed to log back in.
//
// Only treat this as a session-expiry event when the failed request was
// itself authenticated (carried a Bearer token) — a 401 from /auth/login
// on bad credentials must NOT trigger this, since the user is intentionally
// unauthenticated at that point and the Login page already shows that error.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const hadAuthHeader = Boolean(error.config?.headers?.Authorization);

    if (status === 401 && hadAuthHeader) {
      localStorage.removeItem('cc_token');
      localStorage.removeItem('cc_user');
      delete apiClient.defaults.headers.common['Authorization'];

      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?expired=1';
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
