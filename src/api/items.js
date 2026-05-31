import apiClient from './client';

const itemService = {
  // ── Liste paginée ──
  getAll: async ({ page = 0, limit = 20, search = '', type = '' } = {}) => {
    const filters = [['disabled', '=', 0]];
    if (type === 'service') filters.push(['is_stock_item', '=', 0]);
    if (type === 'product') filters.push(['is_stock_item', '=', 1]);

    const params = {
      fields: JSON.stringify([
        'name', 'item_name', 'item_code', 'item_group',
        'description', 'standard_rate', 'is_sales_item',
        'is_purchase_item', 'is_stock_item', 'disabled',
      ]),
      filters: JSON.stringify(filters),
      limit_page_length: limit,
      limit_start: page * limit,
      order_by: 'creation desc',
    };

    if (search) {
      params.or_filters = JSON.stringify([
        ['item_name', 'like', `%${search}%`],
        ['item_code', 'like', `%${search}%`],
        ['name', 'like', `%${search}%`],
      ]);
    }

    const res = await apiClient.get('/resource/Item', { params });
    return res.data.data;
  },

  // ── Comptage ──
  getCount: async ({ search = '', type = '' } = {}) => {
    const filters = [['disabled', '=', 0]];
    if (type === 'service') filters.push(['is_stock_item', '=', 0]);
    if (type === 'product') filters.push(['is_stock_item', '=', 1]);

    const params = {
      doctype: 'Item',
      filters: JSON.stringify(filters),
    };

    const res = await apiClient.get('/method/frappe.client.get_count', { params });
    return res.data.message;
  },

  // ── Détail ──
  getById: async (name) => {
    const res = await apiClient.get(`/resource/Item/${encodeURIComponent(name)}`);
    return res.data.data;
  },

  // ── Créer ──
  create: async (data) => {
    const res = await apiClient.post('/resource/Item', data);
    return res.data.data;
  },

  // ── Modifier ──
  update: async (name, data) => {
    const res = await apiClient.put(`/resource/Item/${encodeURIComponent(name)}`, data);
    return res.data.data;
  },

  // ── Activer / Désactiver ──
  toggleDisabled: async (name, disabled) => {
    const res = await apiClient.put(`/resource/Item/${encodeURIComponent(name)}`, { disabled: disabled ? 1 : 0 });
    return res.data.data;
  },

  // ── Supprimer ──
  delete: async (name) => {
    await apiClient.delete(`/resource/Item/${encodeURIComponent(name)}`);
  },

  // ── Groupes d'articles ──
  getGroups: async () => {
    const res = await apiClient.get('/resource/Item Group', {
      params: {
        fields: JSON.stringify(['name', 'parent_item_group', 'is_group']),
        limit_page_length: 200,
      },
    });
    return res.data.data;
  },

  // ── Unités de mesure ──
  getUOMs: async () => {
    const res = await apiClient.get('/resource/UOM', {
      params: {
        fields: JSON.stringify(['name']),
        limit_page_length: 100,
      },
    });
    return res.data.data;
  },

  // ── Templates de taxes article ──
  getItemTaxTemplates: async () => {
    const res = await apiClient.get('/resource/Item Tax Template', {
      params: {
        fields: JSON.stringify(['name', 'title']),
        limit_page_length: 100,
      },
    });
    return res.data.data;
  },

  // ── Comptes de revenus (pour associer à l'article) ──
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

  // ── Comptes de charges (pour articles achat) ──
  getExpenseAccounts: async (company) => {
    const res = await apiClient.get('/resource/Account', {
      params: {
        fields: JSON.stringify(['name', 'account_name']),
        filters: JSON.stringify([
          ['company', '=', company],
          ['root_type', '=', 'Expense'],
          ['is_group', '=', 0],
        ]),
        limit_page_length: 200,
      },
    });
    return res.data.data;
  },

  // ── Sociétés ──
  getCompanies: async () => {
    const res = await apiClient.get('/resource/Company', {
      params: {
        fields: JSON.stringify(['name', 'company_name']),
        limit_page_length: 100,
      },
    });
    return res.data.data;
  },

  // ── Prix d'un article ──
  getPrices: async (itemCode) => {
    const res = await apiClient.get('/resource/Item Price', {
      params: {
        filters: JSON.stringify([['item_code', '=', itemCode]]),
        fields: JSON.stringify([
          'name', 'price_list', 'price_list_rate',
          'currency', 'selling', 'buying', 'valid_from', 'valid_upto',
        ]),
        limit_page_length: 100,
      },
    });
    return res.data.data;
  },

  // ── Créer un prix ──
  createPrice: async (data) => {
    const res = await apiClient.post('/resource/Item Price', data);
    return res.data.data;
  },

  // ── Modifier un prix ──
  updatePrice: async (name, data) => {
    const res = await apiClient.put(`/resource/Item Price/${encodeURIComponent(name)}`, data);
    return res.data.data;
  },

  // ── Supprimer un prix ──
  deletePrice: async (name) => {
    await apiClient.delete(`/resource/Item Price/${encodeURIComponent(name)}`);
  },
};

export default itemService;
