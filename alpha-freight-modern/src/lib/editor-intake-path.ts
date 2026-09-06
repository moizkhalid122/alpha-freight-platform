/** Private editor intake form — not linked from public site navigation. */
export const EDITOR_INTAKE_PATH =
  process.env.EDITOR_INTAKE_PATH?.trim().replace(/\/+$/, "") || "/join/creative-intake-7m2x";

export const EDITOR_INTAKE_BUCKET = "editor-intake";

export function editorIntakePath(): string {
  return EDITOR_INTAKE_PATH;
}
