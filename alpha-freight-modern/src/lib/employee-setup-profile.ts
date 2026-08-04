export async function setupEmployeeProfile(
  accessToken: string,
  payload: { fullName: string; position?: string; department?: string }
): Promise<string | null> {
  const res = await fetch("/api/employee/setup-profile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      fullName: payload.fullName,
      position: payload.position,
      department: payload.department,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) return data.error || "Could not set up employee profile.";
  return null;
}
