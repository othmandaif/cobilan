import apiClient from './client';

const authService = {
  login: async (email, password) => {
    const res = await fetch('/api/method/login', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ usr: email, pwd: password }),
    });

    if (!res.ok) {
      const error = new Error('Login failed');
      error.response = { status: res.status };
      throw error;
    }
    return await res.json();
  },

  logout: async () => {
    await fetch('/api/method/logout', { credentials: 'include' });
  },

  getCurrentUser: async () => {
    const res = await fetch('/api/method/frappe.auth.get_logged_user', {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error('Not logged in');
    const data = await res.json();
    return data.message;
  },

  getUserInfo: async (email) => {
    const params = new URLSearchParams({
      doctype: 'User',
      filters: JSON.stringify({ name: email }),
      fieldname: JSON.stringify(['full_name', 'email', 'user_image', 'role_profile_name']),
    });
    const res = await fetch(`/api/method/frappe.client.get_value?${params}`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error('Failed');
    const data = await res.json();
    return data.message;
  },
};

export default authService;