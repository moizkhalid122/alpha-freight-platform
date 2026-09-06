export type EditorIntakeMetadata = {
  submission_id?: string | null;
  gender?: string | null;
  whatsapp?: string | null;
  city?: string | null;
  country?: string | null;
  address?: string | null;
  editor_role?: string | null;
  portfolio_url?: string | null;
  linkedin_url?: string | null;
  instagram_url?: string | null;
  tools?: string | null;
  experience_years?: string | null;
  preferred_start_date?: string | null;
  equipment?: string | null;
  photo_url?: string | null;
  photo_path?: string | null;
  id_document_url?: string | null;
  id_document_path?: string | null;
};

const editorRoleLabels: Record<string, string> = {
  content_editor: "Content Editor",
  video_editor: "Video Editor",
  social_media_editor: "Social Media Editor",
  graphic_designer: "Graphic Designer",
  other: "Other",
};

export function parseEditorIntakeMetadata(metadata: Record<string, unknown> | null | undefined) {
  const data = (metadata ?? {}) as EditorIntakeMetadata;
  const role = data.editor_role ?? "";
  let roleLabel = editorRoleLabels[role];
  if (!roleLabel) {
    const formatted = role.replace(/_/g, " ");
    roleLabel = formatted || "Editor";
  }
  return {
    ...data,
    roleLabel,
    genderLabel: data.gender === "male" ? "Male" : data.gender === "female" ? "Female" : "—",
  };
}

export function editorIntakeAdminPath() {
  return "/ops-af-7x9k2/editor-intake";
}
