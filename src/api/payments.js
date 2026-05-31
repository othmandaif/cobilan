import apiClient from './client';

const paymentService = {
  getAll: async ({ page = 0, limit = 20, paymentType = '', company = '' } = {}) => {
    const filters = [['docstatus', '!=', 2]];
    if (paymentType) filters.push(['payment_type', '=', paymentType]);
    if (company) filters.push(['company', '=', company]);

    const res = await apiClient.get('/resource/Payment Entry', {
      params: {
        fields: JSON.stringify([
          'name', 'payment_type', 'party_type', 'party', 'party_name',
          'paid_amount', 'posting_date', 'mode_of_payment',
          'reference_no', 'docstatus',
        ]),
        filters: JSON.stringify(filters),
        limit_page_length: limit,
        limit_start: page * limit,
        order_by: 'posting_date desc',
      },
    });
    return res.data.data;
  },

  getCount: async ({ paymentType = '', company = '' } = {}) => {
    const filters = [['docstatus', '!=', 2]];
    if (paymentType) filters.push(['payment_type', '=', paymentType]);
    if (company) filters.push(['company', '=', company]);
    const res = await apiClient.get('/method/frappe.client.get_count', {
      params: { doctype: 'Payment Entry', filters: JSON.stringify(filters) },
    });
    return res.data.message;
  },

  getById: async (name) => {
    const res = await apiClient.get(`/resource/Payment Entry/${encodeURIComponent(name)}`);
    return res.data.data;
  },

  create: async (data) => {
    const res = await apiClient.post('/resource/Payment Entry', data);
    return res.data.data;
  },

  submit: async (name) => {
    const docRes = await apiClient.get(`/resource/Payment Entry/${encodeURIComponent(name)}`);
    const res = await apiClient.post('/method/frappe.client.submit', { doc: docRes.data.data });
    return res.data;
  },

  cancel: async (name) => {
    const res = await apiClient.post('/method/frappe.client.cancel', {
      doctype: 'Payment Entry', name,
    });
    return res.data;
  },

  delete: async (name) => {
    await apiClient.delete(`/resource/Payment Entry/${encodeURIComponent(name)}`);
  },

  // Factures impayées d'un tiers (pour lettrage)
  getUnpaidInvoices: async (partyType, party) => {
    const doctype = partyType === 'Customer' ? 'Sales Invoice' : 'Purchase Invoice';
    const partyField = partyType === 'Customer' ? 'customer' : 'supplier';
    const res = await apiClient.get(`/resource/${doctype}`, {
      params: {
        filters: JSON.stringify([
          [partyField, '=', party],
          ['docstatus', '=', 1],
          ['outstanding_amount', '>', 0],
        ]),
        fields: JSON.stringify(['name', 'posting_date', 'grand_total', 'outstanding_amount', 'due_date']),
        order_by: 'posting_date asc',
        limit_page_length: 50,
      },
    });
    return res.data.data;
  },

  // Clients pour le select
  getCustomers: async () => {
    const res = await apiClient.get('/resource/Customer', {
      params: { fields: JSON.stringify(['name', 'customer_name']), limit_page_length: 100 },
    });
    return res.data.data;
  },

  // Fournisseurs pour le select
  getSuppliers: async () => {
    const res = await apiClient.get('/resource/Supplier', {
      params: { fields: JSON.stringify(['name', 'supplier_name']), limit_page_length: 100 },
    });
    return res.data.data;
  },

  // Comptes bancaires
  getBankAccounts: async (company = '') => {
    const filters = company ? [['company', '=', company]] : [];
    const res = await apiClient.get('/resource/Account', {
      params: {
        fields: JSON.stringify(['name', 'account_name']),
        filters: JSON.stringify([
          ...filters,
          ['account_type', 'in', ['Bank', 'Cash']],
          ['is_group', '=', 0],
        ]),
        limit_page_length: 200,
      },
    });
    return res.data.data;
  },

  // Comptes débiteurs/créditeurs
  getPartyAccount: async (partyType, company) => {
    const accountType = partyType === 'Customer' ? 'Receivable' : 'Payable';
    const res = await apiClient.get('/resource/Account', {
      params: {
        fields: JSON.stringify(['name']),
        filters: JSON.stringify([
          ['company', '=', company],
          ['account_type', '=', accountType],
          ['is_group', '=', 0],
        ]),
        limit_page_length: 1,
      },
    });
    return res.data.data?.[0]?.name || '';
  },

  getModes: async () => {
    const res = await apiClient.get('/resource/Mode of Payment', {
      params: { fields: JSON.stringify(['name']), limit_page_length: 100 },
    });
    return res.data.data;
  },

  getCompanies: async () => {
    const res = await apiClient.get('/resource/Company', {
      params: { fields: JSON.stringify(['name', 'company_name']), limit_page_length: 100 },
    });
    return res.data.data;
  },
};

export default paymentService;
