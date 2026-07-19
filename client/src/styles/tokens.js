/**
 * CommuniCare Design Tokens
 * Single source of truth for colors, typography, and spacing.
 * Import this in any page/component that uses inline React styles.
 *
 * Palette rationale:
 *  - Primary blue  #1565c0 — 4.7:1 contrast on white (WCAG AA)
 *  - Success green #2e7d32 — 5.1:1 contrast on white (WCAG AA)
 *  - All text dark shades exceed 4.5:1 on white backgrounds
 *  - Board category colors are distinct, color-blind-friendly, and AAC-familiar
 */

// ── Colors ──────────────────────────────────────────────────────────────────

export const color = {
  primary:        '#1565c0',
  primaryDark:    '#0d47a1',
  primaryLight:   '#e3f2fd',
  primaryMid:     '#90caf9',

  success:        '#2e7d32',
  successLight:   '#e8f5e9',
  successBorder:  '#a5d6a7',

  danger:         '#c62828',
  dangerLight:    '#ffebee',
  dangerBorder:   '#ef9a9a',

  warning:        '#e65100',
  warningLight:   '#fff3e0',
  warningBorder:  '#ffcc80',

  ai:             '#6a1b9a',
  aiLight:        '#f3e5f5',
  aiBorder:       '#ce93d8',

  // Layout
  pageBg:         '#f0f4f9',
  surface:        '#ffffff',
  mutedBg:        '#f5f7fa',
  border:         '#dde3ea',
  borderLight:    '#eaf0f6',

  // Text
  textH:          '#0f1c2e',
  textBody:       '#2c3e52',
  textSecondary:  '#4f6070',
  textMuted:      '#7a8fa0',
};

// ── Board category meta (AAC colors) ────────────────────────────────────────

export const catMeta = {
  body_part: { label: 'Body Part', color: '#1565c0', bg: '#e3f2fd', border: '#90caf9' },
  need:      { label: 'Need',      color: '#2e7d32', bg: '#e8f5e9', border: '#a5d6a7' },
  emotion:   { label: 'Emotion',   color: '#6a1b9a', bg: '#f3e5f5', border: '#ce93d8' },
  symptom:   { label: 'Symptom',   color: '#bf360c', bg: '#fbe9e7', border: '#ffab91' },
  free_text: { label: 'Free Text', color: '#37474f', bg: '#f0f4f8', border: '#b0bec5' },
};

// ── Typography ───────────────────────────────────────────────────────────────

export const font = {
  family: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
  base:   '1rem',      // 16px
  sm:     '0.875rem',  // 14px  (was 0.78–0.85rem in old design)
  xs:     '0.8125rem', // 13px
  lg:     '1.125rem',
  xl:     '1.375rem',
  h1:     '2rem',
  h2:     '1.625rem',
  h3:     '1.25rem',
};

// ── Spacing / Shape ─────────────────────────────────────────────────────────

export const shape = {
  radius:    '14px',
  radiusSm:  '10px',
  radiusXs:  '8px',
  radiusPill:'999px',
};

// ── Shared component styles ──────────────────────────────────────────────────

export const shared = {
  page: {
    minHeight: '100vh',
    background: color.pageBg,
    fontFamily: font.family,
    color: color.textBody,
  },

  card: {
    background: color.surface,
    borderRadius: shape.radius,
    border: `1px solid ${color.border}`,
    boxShadow: '0 2px 12px rgba(15,28,46,0.07)',
  },

  input: {
    padding: '12px 16px',
    borderRadius: shape.radiusSm,
    border: `1.5px solid ${color.border}`,
    fontSize: font.base,
    outline: 'none',
    fontFamily: font.family,
    color: color.textBody,
    background: color.surface,
    width: '100%',
    transition: 'border-color .2s',
  },

  label: {
    fontSize: font.sm,
    fontWeight: '600',
    color: color.textSecondary,
    display: 'block',
    marginBottom: '5px',
  },

  // Primary action button
  btnPrimary: {
    padding: '12px 24px',
    background: color.primary,
    color: '#fff',
    border: 'none',
    borderRadius: shape.radiusSm,
    fontSize: font.base,
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background .15s',
  },

  // Secondary/ghost button
  btnSecondary: {
    padding: '12px 24px',
    background: color.surface,
    color: color.textSecondary,
    border: `1.5px solid ${color.border}`,
    borderRadius: shape.radiusSm,
    fontSize: font.base,
    fontWeight: '600',
    cursor: 'pointer',
  },

  // Success/confirm button
  btnSuccess: {
    padding: '12px 24px',
    background: color.success,
    color: '#fff',
    border: 'none',
    borderRadius: shape.radiusSm,
    fontSize: font.base,
    fontWeight: '700',
    cursor: 'pointer',
  },

  // Danger/destructive button
  btnDanger: {
    padding: '12px 24px',
    background: color.dangerLight,
    color: color.danger,
    border: `1.5px solid ${color.dangerBorder}`,
    borderRadius: shape.radiusSm,
    fontSize: font.base,
    fontWeight: '700',
    cursor: 'pointer',
  },

  errorBox: {
    background: color.dangerLight,
    color: color.danger,
    border: `1px solid ${color.dangerBorder}`,
    borderRadius: shape.radiusSm,
    padding: '12px 16px',
    fontSize: font.sm,
    fontWeight: '500',
  },
};
