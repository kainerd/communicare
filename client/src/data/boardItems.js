export const BOARD = {
  body_part: [
    { label: 'Head',    icon: '🧠' },
    { label: 'Eyes',    icon: '👁️' },
    { label: 'Ears',    icon: '👂' },
    { label: 'Nose',    icon: '👃' },
    { label: 'Throat',  icon: '🗣️' },
    { label: 'Chest',   icon: '🫁' },
    { label: 'Heart',   icon: '❤️' },
    { label: 'Stomach', icon: '🫃' },
    { label: 'Back',    icon: '🔙' },
    { label: 'Arm',     icon: '💪' },
    { label: 'Hand',    icon: '✋' },
    { label: 'Leg',     icon: '🦵' },
    { label: 'Foot',    icon: '🦶' },
  ],
  need: [
    { label: 'Water',     icon: '💧' },
    { label: 'Food',      icon: '🍽️' },
    { label: 'Bathroom',  icon: '🚽' },
    { label: 'Rest',      icon: '😴' },
    { label: 'Medicine',  icon: '💊' },
    { label: 'Help',      icon: '🆘' },
    { label: 'Blanket',   icon: '🛏️' },
    { label: 'Cold',      icon: '🧊' },
    { label: 'Warmth',    icon: '🔥' },
    { label: 'Doctor',    icon: '👨‍⚕️' },
    { label: 'Family',    icon: '👨‍👩‍👧' },
    { label: 'Phone',     icon: '📱' },
  ],
  emotion: [
    { label: 'Pain',      icon: '😣' },
    { label: 'Scared',    icon: '😨' },
    { label: 'Anxious',   icon: '😰' },
    { label: 'Tired',     icon: '😩' },
    { label: 'Confused',  icon: '😕' },
    { label: 'Sad',       icon: '😢' },
    { label: 'Calm',      icon: '😌' },
    { label: 'Better',    icon: '😊' },
    { label: 'Worse',     icon: '😖' },
    { label: 'Angry',     icon: '😠' },
    { label: 'Happy',     icon: '😄' },
    { label: 'Frustrated',icon: '😤' },
  ],
  symptom: [
    { label: 'Dizzy',       icon: '🌀' },
    { label: 'Nausea',      icon: '🤢' },
    { label: 'Vomiting',    icon: '🤮' },
    { label: 'Headache',    icon: '🤕' },
    { label: 'Fever',       icon: '🌡️' },
    { label: 'Chills',      icon: '🥶' },
    { label: 'Itching',     icon: '🤧' },
    { label: 'Swelling',    icon: '🫧' },
    { label: 'Numbness',    icon: '💤' },
    { label: 'Difficulty Breathing', icon: '😮‍💨' },
    { label: 'Coughing',    icon: '🤧' },
    { label: 'Bleeding',    icon: '🩸' },
  ],
};

/**
 * CATEGORY_META — drives the AAC board's color-coding.
 * All `color` values meet WCAG AA 4.5:1 on their respective `bg`.
 * Color assignments are consistent with clinical conventions:
 *   Blue = anatomical / body  |  Green = physiological needs
 *   Purple = psycho-emotional |  Orange-red = symptoms/pain
 *   Slate = free text (neutral)
 */
export const CATEGORY_META = {
  body_part: { label: 'Body Part', color: '#1565c0', bg: '#e3f2fd', border: '#90caf9' },
  need:      { label: 'Need',      color: '#2e7d32', bg: '#e8f5e9', border: '#a5d6a7' },
  emotion:   { label: 'Emotion',   color: '#6a1b9a', bg: '#f3e5f5', border: '#ce93d8' },
  symptom:   { label: 'Symptom',   color: '#bf360c', bg: '#fbe9e7', border: '#ffab91' },
  free_text: { label: 'Free Text', color: '#37474f', bg: '#f0f4f8', border: '#b0bec5' },
};
