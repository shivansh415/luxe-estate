/**
 * CursorFollower
 *
 * Intentionally renders NOTHING.
 *
 * The native OS cursor is the correct choice for this luxury experience.
 * Custom round cursors, rings, and dots feel "gaming UI" — not premium.
 *
 * The cinematic interaction comes from the marble reveal shader
 * responding to mouse position (via useCursorLerp), NOT from
 * visual cursor overlays.
 *
 * This component is kept as a no-op so existing imports don't break.
 */
export default function CursorFollower() {
  return null
}
