import apiClient from './client';

const accountingService = {

  // ── PLAN COMPTABLE ──

  getAccounts: async ({ company = '', rootType = '', search = '' } = {}) => {
    const filters = [];
    if (company) filters.push(['company', '=', company]);
    if (rootType) filters.push(['root_type', '=', rootType]);
    if (search) filters.push(['account_name', 'like', `%${search}%`]);

    const res = await apiClient.get('/resource/Account', {
      params: {
        fields: JSON.stringify([
          'name', 'account_name', 'account_number', 'account_type',
          'root_type', 'parent_account', 'is_group', 'disabled',
        ]),
        filters: JSON.stringify(filters),
        limit_page_length: 500,
        order_by: 'account_number asc, account_name asc',
      },
    });
    return res.data.data;
  },

  getAccountById: async (name) => {
    const res = await apiClient.get(`/resource/Account/${encodeURIComponent(name)}`);
    return res.data.data;
  },

  createAccount: async (data) => {
    const res = await apiClient.post('/resource/Account', data);
    return res.data.data;
  },

  updateAccount: async (name, data) => {
    const res = await apiClient.put(`/resource/Account/${encodeURIComponent(name)}`, data);
    return res.data.data;
  },

  // ── EXERCICES FISCAUX ──

  getFiscalYears: async () => {
    const res = await apiClient.get('/resource/Fiscal Year', {
      params: {
        fields: JSON.stringify(['name', 'year_start_date', 'year_end_date']),
        order_by: 'year_start_date desc',
        limit_page_length: 100,
      },
    });
    return res.data.data;
  },

  // ── SOCIÉTÉS ──

  getCompanies: async () => {
    const res = await apiClient.get('/resource/Company', {
      params: {
        fields: JSON.stringify(['name', 'company_name']),
        limit_page_length: 100,
      },
    });
    return res.data.data;
  },

  // ── CENTRES DE COÛT ──

  getCostCenters: async (company = '') => {
    const filters = company ? [['company', '=', company]] : [];
    const res = await apiClient.get('/resource/Cost Center', {
      params: {
        fields: JSON.stringify(['name', 'cost_center_name', 'parent_cost_center', 'is_group']),
        filters: JSON.stringify(filters),
        limit_page_length: 200,
      },
    });
    return res.data.data;
  },

  // ── ÉCRITURES JOURNAL ──

  getJournalEntries: async ({ page = 0, limit = 20, company = '', search = '', voucher_type = '' } = {}) => {
    const filters = [['docstatus', '!=', 2]];
    if (company) filters.push(['company', '=', company]);
    if (voucher_type) filters.push(['voucher_type', '=', voucher_type]);

    const params = {
      fields: JSON.stringify([
        'name', 'posting_date', 'voucher_type', 'company',
        'total_debit', 'total_credit', 'remark', 'docstatus',
      ]),
      filters: JSON.stringify(filters),
      limit_page_length: limit,
      limit_start: page * limit,
      order_by: 'posting_date desc',
    };

    if (search) {
      params.or_filters = JSON.stringify([
        ['name', 'like', `%${search}%`],
        ['remark', 'like', `%${search}%`],
      ]);
    }

    const res = await apiClient.get('/resource/Journal Entry', { params });
    return res.data.data;
  },

  getJournalEntryCount: async ({ company = '', voucher_type = '' } = {}) => {
    const filters = [['docstatus', '!=', 2]];
    if (company) filters.push(['company', '=', company]);
    if (voucher_type) filters.push(['voucher_type', '=', voucher_type]);

    const res = await apiClient.get('/method/frappe.client.get_count', {
      params: { doctype: 'Journal Entry', filters: JSON.stringify(filters) },
    });
    return res.data.message;
  },

  getJournalEntryById: async (name) => {
    const res = await apiClient.get(`/resource/Journal Entry/${encodeURIComponent(name)}`);
    return res.data.data;
  },

  createJournalEntry: async (data) => {
    const res = await apiClient.post('/resource/Journal Entry', data);
    return res.data.data;
  },

  submitJournalEntry: async (name) => {
    const docRes = await apiClient.get(`/resource/Journal Entry/${encodeURIComponent(name)}`);
    const doc = docRes.data.data;
    const res = await apiClient.post('/method/frappe.client.submit', { doc });
    return res.data;
  },

  cancelJournalEntry: async (name) => {
    const res = await apiClient.post('/method/frappe.client.cancel', {
      doctype: 'Journal Entry',
      name,
    });
    return res.data;
  },

  deleteJournalEntry: async (name) => {
    await apiClient.delete(`/resource/Journal Entry/${encodeURIComponent(name)}`);
  },

  // ── GRAND LIVRE ──

  getGeneralLedger: async ({ company, fromDate, toDate, account = '', partyType = '', party = '', groupBy = 'Group by Voucher' } = {}) => {
    const res = await apiClient.post('/method/frappe.desk.query_report.run', {
      report_name: 'General Ledger',
      filters: {
        company,
        from_date: fromDate,
        to_date: toDate,
        account: account || '',
        party_type: partyType || '',
        party: party || '',
        group_by: groupBy,
        include_default_book_entries: 1,
      },
    });
    return res.data.message;
  },

  // ── BALANCE DES COMPTES ──

  getTrialBalance: async ({ company, fiscalYear, showZeroValues = 0 } = {}) => {
    const res = await apiClient.post('/method/frappe.desk.query_report.run', {
      report_name: 'Trial Balance',
      filters: {
        company,
        fiscal_year: fiscalYear,
        show_zero_values: showZeroValues,
        show_unclosed_year_gl_entry: 0,
      },
    });
    return res.data.message;
  },

  // ── PAIEMENTS ──

  getPayments: async ({ page = 0, limit = 20, company = '', paymentType = '' } = {}) => {
    const filters = [['docstatus', '=', 1]];
    if (company) filters.push(['company', '=', company]);
    if (paymentType) filters.push(['payment_type', '=', paymentType]);

    const res = await apiClient.get('/resource/Payment Entry', {
      params: {
        fields: JSON.stringify([
          'name', 'payment_type', 'party_type', 'party', 'party_name',
          'paid_amount', 'posting_date', 'reference_no', 'mode_of_payment',
        ]),
        filters: JSON.stringify(filters),
        limit_page_length: limit,
        limit_start: page * limit,
        order_by: 'posting_date desc',
      },
    });
    return res.data.data;
  },
};

export default accountingService;
