const BASE_URL = '/api';

let _sessionToken = null;

export function setSessionToken(token) {
  _sessionToken = token;
}

function authedFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(_sessionToken ? { Authorization: `Bearer ${_sessionToken}` } : {}),
      ...(options.headers ?? {}),
    },
  });
}

export async function getWarehouses(lang = 'en') {
  const params = new URLSearchParams({ lang });
  const res = await authedFetch(`${BASE_URL}/warehouses?${params}`);
  if (!res.ok) throw new Error(`Failed to fetch warehouses (${res.status})`);
  return res.json();
}

export async function getWarehouseByCode(code) {
  const res = await authedFetch(`${BASE_URL}/warehouses?code=${encodeURIComponent(code)}`);
  if (!res.ok) throw new Error(`Failed to validate warehouse (${res.status})`);
  const list = await res.json();
  return list.length > 0 ? list[0] : null;
}

export async function getDevices(warehouse) {
  const res = await authedFetch(`${BASE_URL}/devices?warehouse=${encodeURIComponent(warehouse)}`);
  if (!res.ok) throw new Error(`Failed to fetch devices (${res.status})`);
  return res.json();
}

export async function getIssueCategories(device, warehouse) {
  const params = new URLSearchParams({ warehouse, device });
  const res = await authedFetch(`${BASE_URL}/issues?${params}`);
  if (!res.ok) throw new Error(`Failed to fetch issues (${res.status})`);
  return res.json();
}

export async function submitReport(reportData) {
  const res = await authedFetch(`${BASE_URL}/submit`, {
    method: 'POST',
    body: JSON.stringify(reportData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Submission failed (${res.status})`);
  }
  return res.json();
}
