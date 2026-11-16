export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'Something went wrong. Try again.';
}

export async function apiRequest<Result>(path: string, options?: RequestInit): Promise<Result> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, options);
  } catch (error) {
    if (options?.signal?.aborted) throw error;
    throw new ApiError('Could not reach the server. Check your connection.', 'network_error');
  }

  const body: unknown = await response.json().catch(() => null);
  if (response.ok && body !== null) return body as Result;

  if (body && typeof body === 'object' && 'message' in body && typeof body.message === 'string') {
    throw new ApiError(
      body.message,
      'code' in body && typeof body.code === 'string' ? body.code : 'request_error',
      'details' in body ? body.details : undefined,
    );
  }
  throw new ApiError(
    `The server returned an unexpected response (HTTP ${response.status}).`,
    'request_error',
  );
}

export function jsonOptions(method: 'POST' | 'PUT', body: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
