import { env } from '../config/env';

function getCookie(name) {
  const prefix = `${name}=`;
  const value = document.cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix))
    ?.slice(prefix.length) || '';
  try { return decodeURIComponent(value); } catch (_error) { return value; }
}

function getCsrfToken() {
  return getCookie(env.csrfCookieName);
}

function normalizeHeaders(headers = {}) {
  if (headers instanceof Headers) return Object.fromEntries(headers.entries());
  return { ...headers };
}

function splitPath(path = '') {
  const raw = String(path || '');
  const [pathname, query = ''] = raw.split('?');
  return { pathname, query: query ? `?${query}` : '' };
}

function withQuery(path, query, defaultQuery = '') {
  if (query) return `${path}${query}`;
  return defaultQuery ? `${path}${defaultQuery}` : path;
}

function mapDashboardPath(path, method) {
  const { pathname, query } = splitPath(path);
  const upper = String(method || 'GET').toUpperCase();

  const retailPrefixes = [
    '/retail-dashboard', '/retail/overview', '/overview', '/business-reports', '/reports',
    '/products', '/categories', '/warehouses', '/customers', '/suppliers', '/pos',
    '/sales-invoices', '/purchases', '/invoices', '/returns', '/transfers',
    '/inventory-count', '/inventory-counts', '/treasury'
  ];
  if (retailPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return `/admin${pathname}${query}`;
  }

  if (upper === 'GET') {
    if (pathname === '/profile' || pathname === '/profile/me') return '/auth/me';
    if (pathname === '/auth/profile' || pathname === '/auth/me') return '/auth/me';
    if (pathname === '/analytics') return withQuery('/admin/analytics', query);
    if (pathname === '/medicines') return withQuery('/admin/inventory', query, '?limit=100');
    if (pathname === '/drugs') return withQuery('/admin/drugs', query, '?limit=100');
    if (pathname === '/notifications') return withQuery('/notifications', query, query ? '' : '?limit=50');
    if (pathname === '/users') return withQuery('/admin/users', query, '?limit=100');
    if (pathname === '/support-tickets') return withQuery('/support-tickets', query, '?limit=100');
    if (pathname === '/approval-requests' || pathname === '/pharmacy-requests') return withQuery('/admin/pharmacy-requests', query, query ? '' : '?status=pending');
    if (pathname === '/pharmacies') return withQuery('/admin/pharmacies', query, '?limit=100');
    if (pathname.startsWith('/pharmacies/')) return `/admin${pathname}${query}`;
    if (pathname.startsWith('/medicines/')) return `/admin/drugs/${pathname.split('/').pop()}${query}`;
  }

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(upper)) {
    if (pathname === '/users') return '/admin/users';
    if (pathname.startsWith('/users/')) return `/admin${pathname}${query}`;
    if (pathname === '/support-tickets') return '/support-tickets';
    if (pathname.startsWith('/support-tickets/')) return `${pathname}${query}`;
    if (pathname === '/approval-requests' || pathname === '/pharmacy-requests') return '/admin/pharmacy-requests';
    if (pathname.startsWith('/approval-requests/')) return `/admin/pharmacy-requests/${pathname.slice('/approval-requests/'.length)}${query}`;
    if (pathname.startsWith('/pharmacy-requests/')) return `/admin${pathname}${query}`;
    if (pathname === '/pharmacies') return '/admin/pharmacies';
    if (pathname.startsWith('/pharmacies/')) return `/admin${pathname}${query}`;
    if (pathname === '/analytics') return withQuery('/admin/analytics', query);
  }

  return path;
}

function shouldAttemptRefresh(path) {
  const pathname = splitPath(path).pathname;
  if (pathname === '/auth/me' || pathname === '/profile/me' || pathname === '/profile') return true;
  return !pathname.startsWith('/auth/');
}

function notifyAuthExpired() {
  window.dispatchEvent(new CustomEvent('adwety:auth-expired'));
}

async function performFetch(path, options = {}) {
  const method = String(options.method || 'GET').toUpperCase();
  const headers = {
    Accept: 'application/json',
    ...normalizeHeaders(options.headers),
  };

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
  }

  const mappedPath = mapDashboardPath(path, method);
  const response = await fetch(`${env.apiBaseUrl}${mappedPath}`, {
    ...options,
    method,
    credentials: 'include',
    headers,
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

let refreshPromise = null;
async function refreshBrowserSession() {
  if (!refreshPromise) {
    refreshPromise = performFetch('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    }).then(({ response, data }) => {
      if (!response.ok || data.success === false) {
        const error = new Error(data.message || 'Session refresh failed');
        error.status = response.status;
        error.payload = data;
        throw error;
      }
      return data;
    }).finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

async function rawApiRequest(path, options = {}, state = {}) {
  const { response, data } = await performFetch(path, options);

  if (response.status === 401 && !state.retried && shouldAttemptRefresh(path)) {
    try {
      await refreshBrowserSession();
      return rawApiRequest(path, options, { retried: true });
    } catch (_refreshError) {
      notifyAuthExpired();
    }
  }

  if (!response.ok || data.success === false) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

async function apiRequest(path, options = {}) {
  return rawApiRequest(path, options);
}

function asArray(payload) {
  const candidates = [
    payload,
    payload?.data,
    payload?.data?.data,
    payload?.results,
    payload?.data?.results,
    payload?.items,
    payload?.data?.items,
    payload?.notifications,
    payload?.data?.notifications,
    payload?.medicines,
    payload?.data?.medicines,
    payload?.drugs,
    payload?.data?.drugs,
    payload?.pharmacies,
    payload?.data?.pharmacies,
    payload?.users,
    payload?.data?.users,
    payload?.inventory,
    payload?.data?.inventory,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
}

function valueOf(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return '';
}

function numberOf(...values) {
  const value = valueOf(...values);
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function idOf(value) {
  if (!value) return '';
  return String(value.id || value._id || value);
}

export function normalizePharmacy(item = {}) {
  return {
    ...item,
    id: idOf(item.id || item._id),
    name: valueOf(item.name, item.pharmacy_name, item.pharmacyName),
    address: valueOf(item.address),
    phone: valueOf(item.phone, item.phoneNumber, item.phone_number),
    email: valueOf(item.email),
    status: valueOf(item.status, 'active'),
    rating: numberOf(item.rating),
    latitude: numberOf(item.latitude, item.lat, item.location?.coordinates?.[1]),
    longitude: numberOf(item.longitude, item.lng, item.location?.coordinates?.[0]),
    working_hours: valueOf(item.working_hours, item.workingHours),
    workingHours: valueOf(item.workingHours, item.working_hours),
    inventory_count: numberOf(item.inventory_count, item.inventoryCount),
    google_maps_url: item.google_maps_url || item.googleMapsUrl || '',
  };
}

export function normalizeMedicine(item = {}) {
  const drug = item.drug || item.drugId || {};
  const pharmacy = item.pharmacy || item.pharmacyId || {};
  const inventoryId = idOf(item.inventory_id || item.inventoryId || item.inventory?.id || item.inventory?._id || (item.drug ? item.id : ''));
  const drugId = idOf(item.drug_id || item.drugId || drug.id || drug._id || item.id || item._id);
  const pharmacyId = idOf(item.pharmacy_id || item.pharmacyId || pharmacy.id || pharmacy._id);

  return {
    ...item,
    id: drugId || idOf(item.id || item._id),
    drug_id: drugId,
    drugId,
    inventory_id: inventoryId,
    inventoryId,
    pharmacy_id: pharmacyId,
    pharmacyId,
    name: valueOf(item.name, item.genericName, item.generic_name, drug.name, drug.genericName, drug.generic_name),
    genericName: valueOf(item.genericName, item.generic_name, drug.genericName, drug.generic_name, item.name),
    generic_name: valueOf(item.generic_name, item.genericName, drug.generic_name, drug.genericName, item.name),
    category: valueOf(item.category, drug.category, 'General'),
    strength: valueOf(item.strength, drug.strength),
    form: valueOf(item.form, item.dosageForm, item.dosage_form, drug.form, drug.dosageForm, drug.dosage_form),
    dosageForm: valueOf(item.dosageForm, item.dosage_form, drug.dosageForm, drug.dosage_form, item.form),
    dosage_form: valueOf(item.dosage_form, item.dosageForm, drug.dosage_form, drug.dosageForm, item.form),
    description: valueOf(item.description, drug.description),
    price: numberOf(item.price, item.unit_price, item.unitPrice, item.inventory?.price),
    quantity: numberOf(item.quantity, item.available_quantity, item.availableQuantity, item.stock, item.inventory?.quantity),
    pharmacy_name: valueOf(item.pharmacy_name, item.pharmacyName, pharmacy.name),
    pharmacyName: valueOf(item.pharmacyName, item.pharmacy_name, pharmacy.name),
    updated_at: valueOf(item.updated_at, item.updatedAt, item.inventory?.updated_at, item.inventory?.updatedAt),
    created_at: valueOf(item.created_at, item.createdAt),
  };
}

export function normalizeNotification(item = {}) {
  const isRead = Boolean(item.is_read ?? item.isRead ?? item.read);
  const type = String(item.type || item.status || 'system').includes('stock') ? 'stock' : 'system';
  return {
    ...item,
    id: idOf(item.id || item._id),
    type,
    title: valueOf(item.title, item.action, item.status, type === 'stock' ? 'Stock alert' : 'System log'),
    message: valueOf(item.message, item.errorMessage, item.extractedText, item.action, 'System activity'),
    is_read: isRead,
    isRead,
    read: isRead,
    created_at: valueOf(item.created_at, item.createdAt),
    updated_at: valueOf(item.updated_at, item.updatedAt),
  };
}

export function extractArray(payload, fallback = []) {
  const array = asArray(payload);
  if (!array.length) return Array.isArray(fallback) ? fallback : [];

  if (array.some((item) => item?.drug || item?.drug_id || item?.drugId || item?.inventory_id || item?.inventoryId)) {
    return array.map(normalizeMedicine);
  }

  if (array.some((item) => item?.action || item?.actorRole || item?.actor_role || item?.extractedText || item?.extracted_text || item?.is_read || item?.read || item?.title)) {
    return array.map(normalizeNotification);
  }

  if (array.some((item) => item?.address || item?.latitude || item?.longitude || item?.pharmacy_name || item?.pharmacyName)) {
    return array.map(normalizePharmacy);
  }

  if (array.some((item) => item?.genericName || item?.generic_name || item?.dosageForm || item?.dosage_form)) {
    return array.map(normalizeMedicine);
  }

  return array;
}

export function extractObject(payload, fallback = {}) {
  const candidates = [
    payload?.data?.data,
    payload?.data,
    payload,
  ];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) return candidate;
  }

  return fallback;
}

export function extractPharmacyDetails(payload, fallback = {}) {
  const object = extractObject(payload, fallback);
  if (object?.pharmacy) {
    const pharmacy = normalizePharmacy(object.pharmacy);
    const inventory = Array.isArray(object.inventory) ? object.inventory.map((item) => ({
      ...item,
      drug: normalizeMedicine(item.drug || item),
      inventory: item.inventory || { id: item.inventory_id || item.id, price: item.price || 0, quantity: item.quantity || 0 },
    })) : [];
    return {
      ...object,
      pharmacy,
      inventory,
      stats: object.stats || {
        total_inventory_items: inventory.length,
        low_stock_count: inventory.filter((row) => Number(row.inventory?.quantity || row.quantity || 0) > 0 && Number(row.inventory?.quantity || row.quantity || 0) < 10).length,
        out_of_stock_count: inventory.filter((row) => Number(row.inventory?.quantity || row.quantity || 0) <= 0).length,
      },
    };
  }

  const pharmacy = normalizePharmacy(object);
  return {
    pharmacy,
    inventory: [],
    stats: { total_inventory_items: 0, low_stock_count: 0, out_of_stock_count: 0 },
  };
}

export function getJson(path) {
  return apiRequest(path, { method: 'GET' });
}

export function pharmacyPayload(body = {}) {
  return {
    name: String(body.name || '').trim(),
    address: String(body.address || '').trim(),
    phone: String(body.phone || '').trim(),
    email: String(body.email || '').trim(),
    status: body.status || 'active',
    latitude: Number(body.latitude ?? body.lat),
    longitude: Number(body.longitude ?? body.lng),
    workingHours: body.workingHours ?? body.working_hours ?? '',
    rating: Number(body.rating || 0),
    googleMapsUrl: body.googleMapsUrl ?? body.google_maps_url ?? '',
    ...(body.ownerId || body.owner_id ? { ownerId: body.ownerId || body.owner_id } : {}),
  };
}

export async function postJson(path, body) {
  if (path === '/pharmacies') {
    return apiRequest(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pharmacyPayload(body)) });
  }

  if (path === '/medicines') {
    const drug = await rawApiRequest('/admin/drugs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        genericName: body.name || body.genericName || body.generic_name,
        category: body.category || 'General',
        dosageForm: body.form || body.dosageForm || body.dosage_form || 'Tablet',
        strength: body.strength || 'N/A',
        description: body.description || '',
        brandNames: body.brandNames || body.brand_names || [],
        aliases: body.aliases || [],
        isActive: true,
      }),
    });
    const drugObject = extractObject(drug, {});
    const drugId = drugObject.id || drugObject._id || drugObject.drug_id;
    if (body.pharmacy_id || body.pharmacyId) {
      try {
        return await rawApiRequest('/admin/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pharmacyId: body.pharmacy_id || body.pharmacyId,
            drugId,
            quantity: Number(body.quantity || 0),
            price: Number(body.price || 0),
          }),
        });
      } catch (inventoryError) {
        // Do not leave an orphan drug record when linking it to inventory fails.
        if (drugId) {
          try { await rawApiRequest(`/admin/drugs/${drugId}`, { method: 'DELETE' }); } catch (_rollbackError) { /* original error is more useful */ }
        }
        throw inventoryError;
      }
    }
    return drug;
  }

  return apiRequest(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function putJson(path, body) {
  const { pathname } = splitPath(path);
  if (pathname.startsWith('/pharmacies/')) {
    return apiRequest(path, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pharmacyPayload(body)) });
  }
  if (pathname.startsWith('/medicines/')) {
    const requests = [];
    if (body?.inventory_id || body?.inventoryId) {
      requests.push(rawApiRequest(`/admin/inventory/${body.inventory_id || body.inventoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: Number(body.quantity || 0), price: Number(body.price || 0), pharmacyId: body.pharmacy_id || body.pharmacyId }),
      }));
    }
    if (body?.drug_id || body?.drugId || body?.id) {
      requests.push(rawApiRequest(`/admin/drugs/${body.drug_id || body.drugId || body.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genericName: body.name || body.genericName || body.generic_name,
          category: body.category || 'General',
          dosageForm: body.form || body.dosageForm || body.dosage_form || 'Tablet',
          strength: body.strength || 'N/A',
          description: body.description || '',
        }),
      }));
    }
    const results = await Promise.all(requests);
    return results[0] || { success: true };
  }

  return apiRequest(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function patchJson(path, body) {
  return apiRequest(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function deleteJson(path) {
  const { pathname, query } = splitPath(path);
  if (pathname.startsWith('/medicines/')) {
    const params = new URLSearchParams(query.replace(/^\?/, ''));
    const inventoryId = params.get('inventory_id') || params.get('inventoryId') || pathname.split('/').pop();
    return apiRequest(`/admin/inventory/${inventoryId}`, { method: 'DELETE' });
  }
  return apiRequest(path, { method: 'DELETE' });
}

export function postMultipart(path, formData) {
  return apiRequest(path, {
    method: 'POST',
    body: formData,
  });
}
