import apiClient from './client';

const supplierService = {
  getAll: async ({ page = 0, limit = 20, search = '' } = {}) => {
    const params = {
      fields: JSON.stringify([
        'name', 'supplier_name', 'supplier_type',
        'mobile_no', 'email_id', 'country', 'creation',
      ]),
      limit_page_length: limit,
      limit_start: page * limit,
      order_by: 'creation desc',
    };

    if (search) {
      params.or_filters = JSON.stringify([
        ['supplier_name', 'like', `%${search}%`],
        ['email_id', 'like', `%${search}%`],
        ['mobile_no', 'like', `%${search}%`],
        ['name', 'like', `%${search}%`],
      ]);
    }

    const res = await apiClient.get('/resource/Supplier', { params });
    return res.data.data;
  },

  getCount: async ({ search = '' } = {}) => {
    const params = { doctype: 'Supplier' };
    if (search) {
      params.filters = JSON.stringify([
        ['supplier_name', 'like', `%${search}%`],
      ]);
    }
    const res = await apiClient.get('/method/frappe.client.get_count', { params });
    return res.data.message;
  },

  getById: async (name) => {
    const res = await apiClient.get(`/resource/Supplier/${encodeURIComponent(name)}`);
    return res.data.data;
  },

  create: async (data) => {
    const res = await apiClient.post('/resource/Supplier', data);
    return res.data.data;
  },

  update: async (name, data) => {
    const res = await apiClient.put(`/resource/Supplier/${encodeURIComponent(name)}`, data);
    return res.data.data;
  },

  delete: async (name) => {
    await apiClient.delete(`/resource/Supplier/${encodeURIComponent(name)}`);
  },

  getGroups: async () => {
    const res = await apiClient.get('/resource/Supplier Group', {
      params: {
        fields: JSON.stringify(['name']),
        limit_page_length: 200,
      },
    });
    return res.data.data;
  },

  // Factures d'achat liées à un fournisseur
  getInvoices: async (supplierName) => {
    const res = await apiClient.get('/resource/Purchase Invoice', {
      params: {
        filters: JSON.stringify([
          ['supplier', '=', supplierName],
          ['docstatus', '!=', 2],
        ]),
        fields: JSON.stringify([
          'name', 'posting_date', 'due_date',
          'grand_total', 'outstanding_amount', 'status',
        ]),
        order_by: 'posting_date desc',
        limit_page_length: 20,
      },
    });
    return res.data.data;
  },

  // Adresses liées
  getAddresses: async (supplierName) => {
    const res = await apiClient.get('/resource/Address', {
      params: {
        filters: JSON.stringify([['Dynamic Link', 'link_name', '=', supplierName]]),
        fields: JSON.stringify([
          'name', 'address_title', 'address_type',
          'address_line1', 'city', 'country', 'phone',
        ]),
      },
    });
    return res.data.data;
  },

  // Contacts liés
  getContacts: async (supplierName) => {
    const res = await apiClient.get('/resource/Contact', {
      params: {
        filters: JSON.stringify([['Dynamic Link', 'link_name', '=', supplierName]]),
        fields: JSON.stringify([
          'name', 'first_name', 'last_name', 'email_id', 'mobile_no',
        ]),
      },
    });
    return res.data.data;
  },
};

export default supplierService;
