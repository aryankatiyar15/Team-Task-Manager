const API_URL = import.meta.env.VITE_API_URL || "/api";

export async function request(path, options = {}) {
  const token = localStorage.getItem("ttm_token");
  const headers = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body:
      options.body && !(options.body instanceof FormData)
        ? JSON.stringify(options.body)
        : options.body
  });

  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || "Request failed");
    error.details = data?.details;
    error.status = response.status;
    throw error;
  }

  return data;
}
