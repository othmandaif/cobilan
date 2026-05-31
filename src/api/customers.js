import apiClient from './client';

const customerService = {
  getAll: async ({ page = 0, limit = 20, search = '', filters = [] } = {}) => {
    const params = {
      fields: JSON.stringify([
        'name',
        'customer_name',
        'customer_type',
        'mobile_no',
        'email_id',
        'territory',
        'creation',
      ]),
      limit_page_length: limit,
      limit_start: page * limit,
      order_by: 'creation desc',
    };

    if (filters.length > 0) {
      params.filters = JSON.stringify(filters);
    }

    if (search) {
      params.or_filters = JSON.stringify([
        ['customer_name', 'like', `%${search}%`],
        ['email_id', 'like', `%${search}%`],
        ['mobile_no', 'like', `%${search}%`],
        ['name', 'like', `%${search}%`],
      ]);
    }

    const res = await apiClient.get('/resource/Customer', { params });
    return res.data.data;
  },

  getCount: async ({ search = '', filters = [] } = {}) => {
    const params = { doctype: 'Customer' };

    if (filters.length > 0) {
      params.filters = JSON.stringify(filters);
    }

    if (search) {
      params.filters = JSON.stringify([
        ['customer_name', 'like', `%${search}%`],
      ]);
    }

    const res = await apiClient.get('/method/frappe.client.get_count', { params });
    return res.data.message;
  },

  getById: async (name) => {
    const res = await apiClient.get(`/resource/Customer/${encodeURIComponent(name)}`);
    return res.data.data;
  },

  create: async (data) => {
    const res = await apiClient.post('/resource/Customer', data);
    return res.data.data;
  },

  update: async (name, data) => {
    const res = await apiClient.put(`/resource/Customer/${encodeURIComponent(name)}`, data);
    return res.data.data;
  },

  delete: async (name) => {
    await apiClient.delete(`/resource/Customer/${encodeURIComponent(name)}`);
  },

  getGroups: async () => {
    const res = await apiClient.get('/resource/Customer Group', {
      params: {
        fields: JSON.stringify(['name']),
        limit_page_length: 200,
      },
    });
    return res.data.data;
  },

  getTerritories: async () => {
    const res = await apiClient.get('/resource/Territory', {
      params: {
        fields: JSON.stringify(['name']),
        limit_page_length: 200,
      },
    });
    return res.data.data;
  },

  getInvoices: async (customerName) => {
    const res = await apiClient.get('/resource/Sales Invoice', {
      params: {
        filters: JSON.stringify([['customer', '=', customerName]]),
        fields: JSON.stringify([
          'name',
          'posting_date',
          'due_date',
          'grand_total',
          'outstanding_amount',
          'status',
        ]),
        order_by: 'posting_date desc',
        limit_page_length: 20,
      },
    });
    return res.data.data;
  },

  getAddresses: async (customerName) => {
    const res = await apiClient.get('/resource/Address', {
      params: {
        filters: JSON.stringify([['Dynamic Link', 'link_name', '=', customerName]]),
        fields: JSON.stringify([
          'name',
          'address_title',
          'address_type',
          'address_line1',
          'city',
          'country',
          'phone',
        ]),
      },
    });
    return res.data.data;
  },

  getContacts: async (customerName) => {
    const res = await apiClient.get('/resource/Contact', {
      params: {
        filters: JSON.stringify([['Dynamic Link', 'link_name', '=', customerName]]),
        fields: JSON.stringify([
          'name',
          'first_name',
          'last_name',
          'email_id',
          'mobile_no',
        ]),
      },
    });
    return res.data.data;
  },
};

export default customerService;