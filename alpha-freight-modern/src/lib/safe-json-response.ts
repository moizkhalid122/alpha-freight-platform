/** Parse fetch responses safely — avoids "Unexpected token '<'" when HTML error pages are returned. */
export async function readJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json() as Promise<T>;
  }

  const body = (await response.text()).trim();
  if (body.startsWith("<!DOCTYPE") || body.startsWith("<html")) {
    throw new Error(
      "Server returned a web page instead of data. Hard refresh (Ctrl+Shift+R) or restart the dev server."
    );
  }

  if (!body) {
    throw new Error(`Empty server response (${response.status}).`);
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    throw new Error(body.slice(0, 160) || `Unexpected server response (${response.status}).`);
  }
}
