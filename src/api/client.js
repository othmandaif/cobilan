const API_KEY = '61b215bd3ef8221';
const API_SECRET = 'b33ce5a0113e4ac';
const AUTH_HEADER = `token ${API_KEY}:${API_SECRET}`;

function getCsrfFromCookie() {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [key, val] = cookie.trim().split('=');
    if (key === 'csrf_token') return decodeURIComponent(val);
  }
  return null;
}

const apiClient = {
  setCsrfToken(token) {},

  async get(url, options = {}) {
    const params = options.params || {};
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => query.append(key, value));
    const queryStr = query.toString();
    const fullUrl = `/api${url}${queryStr ? '?' + queryStr : ''}`;

    const res = await fetch(fullUrl, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      const error = new Error(`Request failed: ${res.status}`);
      error.response = { status: res.status, data: await res.json().catch(() => ({})) };
      throw error;
    }
    return { data: await res.json() };
  },

  async post(url, body = {}) {
    // On utilise Authorization header → pas besoin de CSRF token
    const res = await fetch(`/api${url}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: AUTH_HEADER,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const error = new Error(`Request failed: ${res.status}`);
      error.response = { status: res.status, data: errorData };
      throw error;
    }
    return { data: await res.json() };
  },

  async put(url, body = {}) {
    const res = await fetch(`/api${url}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: AUTH_HEADER,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const error = new Error(`Request failed: ${res.status}`);
      error.response = { status: res.status, data: errorData };
      throw error;
    }
    return { data: await res.json() };
  },

  async delete(url) {
    const res = await fetch(`/api${url}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: AUTH_HEADER,
      },
    });

    if (!res.ok) {
      const error = new Error(`Request failed: ${res.status}`);
      error.response = { status: res.status };
      throw error;
    }
    return { data: await res.json().catch(() => ({})) };
  },
};

export const resetCsrfToken = () => {};
export default apiClient;