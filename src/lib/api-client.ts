// Lightweight API client - all calls go through this for unified error handling
"use client";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  url: string,
  opts?: RequestInit & { json?: unknown },
): Promise<T> {
  const headers: Record<string, string> = { ...(opts?.headers as any) };
  let body: BodyInit | undefined = opts?.body;
  if (opts?.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.json);
  }
  const res = await fetch(url, {
    ...opts,
    headers,
    body,
    credentials: "same-origin",
  });
  const text = await res.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }
  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? "request_failed");
  }
  return data as T;
}

export const api = {
  get: <T>(url: string) => request<T>(url, { method: "GET" }),
  post: <T>(url: string, json?: unknown) =>
    request<T>(url, { method: "POST", json }),
  put: <T>(url: string, json?: unknown) =>
    request<T>(url, { method: "PUT", json }),
  patch: <T>(url: string, json?: unknown) =>
    request<T>(url, { method: "PATCH", json }),
  delete: <T>(url: string) => request<T>(url, { method: "DELETE" }),
  upload: <T>(url: string, formData: FormData) =>
    request<T>(url, { method: "POST", body: formData }),
};
