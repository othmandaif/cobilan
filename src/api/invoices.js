import apiClient from './client';

const invoiceService = {
  getAll: async ({ page = 0, limit = 20, status = '', search = '' } = {}) => {
    const filters = [['docstatus', '!=', 2]];
    if (status) filters.push(['status', '=', status]);

    const params = {
      fields: JSON.stringify([
        'name', 'customer', 'customer_name', 'posting_date',
        'due_date', 'grand_total', 'outstanding_amount', 'status', 'docstatus',
      ]),
      filters: JSON.stringify(filters),
      limit_page_length: limit,
      limit_start: page * limit,
      order_by: 'posting_date desc',
    };

    if (search) {
      params.or_filters = JSON.stringify([
        ['customer_name', 'like', `%${search}%`],
        ['name', 'like', `%${search}%`],
      ]);
    }

    const res = await apiClient.get('/resource/Sales Invoice', { params });
    return res.data.data;
  },

  getCount: async ({ status = '' } = {}) => {
    const params = { doctype: 'Sales Invoice' };
    if (status) params.filters = JSON.stringify([['status', '=', status]]);
    const res = await apiClient.get('/method/frappe.client.get_count', { params });
    return res.data.message;
  },

  getById: async (name) => {
    const res = await apiClient.get(`/resource/Sales Invoice/${encodeURIComponent(name)}`);
    return res.data.data;
  },

  create: async (data) => {
    const res = await apiClient.post('/resource/Sales Invoice', data);
    return res.data.data;
  },

  update: async (name, data) => {
    const res = await apiClient.put(`/resource/Sales Invoice/${encodeURIComponent(name)}`, data);
    return res.data.data;
  },

  submit: async (name) => {
    const docRes = await apiClient.get(`/resource/Sales Invoice/${encodeURIComponent(name)}`);
    const doc = docRes.data.data;
    const res = await apiClient.post('/method/frappe.client.submit', { doc });
    return res.data;
  },

  cancel: async (name) => {
    const res = await apiClient.post('/method/frappe.client.cancel', {
      doctype: 'Sales Invoice',
      name,
    });
    return res.data;
  },

  delete: async (name) => {
    await apiClient.delete(`/resource/Sales Invoice/${encodeURIComponent(name)}`);
  },

  getPdfUrl: (name) => {
    return `/factures-vente/${encodeURIComponent(name)}/print`;
  },

  getCompanies: async () => {
    const res = await apiClient.get('/resource/Company', {
      params: {
        fields: JSON.stringify(['name', 'company_name', 'abbr']),
        limit_page_length: 100,
      },
    });
    return res.data.data;
  },

  getCustomers: async (search = '') => {
    const params = {
      fields: JSON.stringify(['name', 'customer_name']),
      limit_page_length: 50,
      order_by: 'customer_name asc',
    };
    if (search) params.filters = JSON.stringify([['customer_name', 'like', `%${search}%`]]);
    const res = await apiClient.get('/resource/Customer', { params });
    return res.data.data;
  },

  getItems: async (search = '') => {
    const params = {
      fields: JSON.stringify(['name', 'item_name', 'standard_rate']),
      filters: JSON.stringify([
        ['is_sales_item', '=', 1],
        ['disabled', '=', 0],
      ]),
      limit_page_length: 100,
    };
    if (search) {
      params.or_filters = JSON.stringify([
        ['item_name', 'like', `%${search}%`],
        ['name', 'like', `%${search}%`],
      ]);
    }
    const res = await apiClient.get('/resource/Item', { params });
    return res.data.data;
  },

  getTaxTemplates: async () => {
    const res = await apiClient.get('/resource/Sales Taxes and Charges Template', {
      params: {
        fields: JSON.stringify(['name', 'title']),
        limit_page_length: 100,
      },
    });
    return res.data.data;
  },

  // Récupère le taux total d'un template de taxes
  getTaxRate: async (templateName) => {
    const res = await apiClient.get(
      `/resource/Sales Taxes and Charges Template/${encodeURIComponent(templateName)}`
    );
    const taxes = res.data.data?.taxes || [];
    return taxes.reduce((sum, t) => sum + (t.rate || 0), 0);
  },

  getIncomeAccounts: async (company) => {
    const res = await apiClient.get('/resource/Account', {
      params: {
        fields: JSON.stringify(['name', 'account_name']),
        filters: JSON.stringify([
          ['company', '=', company],
          ['root_type', '=', 'Income'],
          ['is_group', '=', 0],
        ]),
        limit_page_length: 200,
      },
    });
    return res.data.data;
  },

  createCompany: async (data) => {
    const res = await apiClient.post('/resource/Company', data);
    return res.data.data;
  },

  createCustomer: async (data) => {
    const res = await apiClient.post('/resource/Customer', data);
    return res.data.data;
  },
};

export default invoiceService;