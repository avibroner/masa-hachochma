export function jsonOk(data: Record<string, unknown> = {}, status = 200) {
  return Response.json({ ok: true, ...data }, { status });
}

export function jsonError(error: string, status = 400) {
  return Response.json({ ok: false, error }, { status });
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
