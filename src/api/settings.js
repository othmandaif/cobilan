import apiClient from './client';

const settingsService = {
  getCompany: async (name) => {
    const res = await apiClient.get(`/resource/Company/${encodeURIComponent(name)}`);
    return res.data.data;
  },

  updateCompany: async (name, data) => {
    const res = await apiClient.put(`/resource/Company/${encodeURIComponent(name)}`, data);
    return res.data.data;
  },

getCompanies: async () => {
  const res = await apiClient.get('/resource/Company', {
    params: {
      fields: JSON.stringify(['name', 'company_name', 'abbr', 'country', 'default_currency']),
      limit_page_length: 100,
    },
  });
  return res.data.data;
},
  getFiscalYears: async () => {
    const res = await apiClient.get('/resource/Fiscal Year', {
      params: { fields: JSON.stringify(['name', 'year_start_date', 'year_end_date', 'disabled']), order_by: 'year_start_date desc', limit_page_length: 100 },
    });
    return res.data.data;
  },

  createFiscalYear: async (data) => {
    const res = await apiClient.post('/resource/Fiscal Year', data);
    return res.data.data;
  },

  getPaymentModes: async () => {
    const res = await apiClient.get('/resource/Mode of Payment', {
      params: { fields: JSON.stringify(['name', 'type']), limit_page_length: 100 },
    });
    return res.data.data;
  },

  createPaymentMode: async (data) => {
    const res = await apiClient.post('/resource/Mode of Payment', data);
    return res.data.data;
  },

  deletePaymentMode: async (name) => {
    await apiClient.delete(`/resource/Mode of Payment/${encodeURIComponent(name)}`);
  },

  getUsers: async () => {
    const res = await apiClient.get('/resource/User', {
      params: {
        filters: JSON.stringify([['enabled', '=', 1], ['user_type', '=', 'System User']]),
        fields: JSON.stringify(['name', 'full_name', 'email', 'role_profile_name', 'last_active']),
        limit_page_length: 50,
      },
    });
    return res.data.data;
  },
};

export default settingsService;
