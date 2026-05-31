import apiClient from './client';

const dashboardService = {
  // Nombre total de clients
  getCustomerCount: async () => {
    const res = await apiClient.get('/method/frappe.client.get_count', {
      params: { doctype: 'Customer' },
    });
    return res.data.message;
  },

  // Nombre total de fournisseurs
  getSupplierCount: async () => {
    const res = await apiClient.get('/method/frappe.client.get_count', {
      params: { doctype: 'Supplier' },
    });
    return res.data.message;
  },

  // Factures de vente impayées
  getUnpaidSalesInvoices: async () => {
    const res = await apiClient.get('/resource/Sales Invoice', {
      params: {
        filters: JSON.stringify([
          ['status', 'in', ['Unpaid', 'Overdue']],
          ['docstatus', '=', 1],
        ]),
        fields: JSON.stringify([
          'name',
          'customer',
          'customer_name',
          'posting_date',
          'due_date',
          'grand_total',
          'outstanding_amount',
          'status',
        ]),
        order_by: 'due_date asc',
        limit_page_length: 10,
      },
    });
    return res.data.data;
  },

  // Factures d'achat impayées
  getUnpaidPurchaseInvoices: async () => {
    const res = await apiClient.get('/resource/Purchase Invoice', {
      params: {
        filters: JSON.stringify([
          ['status', 'in', ['Unpaid', 'Overdue']],
          ['docstatus', '=', 1],
        ]),
        fields: JSON.stringify([
          'name',
          'supplier',
          'supplier_name',
          'posting_date',
          'due_date',
          'grand_total',
          'outstanding_amount',
          'status',
        ]),
        order_by: 'due_date asc',
        limit_page_length: 10,
      },
    });
    return res.data.data;
  },

  // Total encaissements en attente (somme outstanding_amount ventes)
  getTotalReceivable: async () => {
    const res = await apiClient.get('/resource/Sales Invoice', {
      params: {
        filters: JSON.stringify([
          ['status', 'in', ['Unpaid', 'Overdue', 'Partly Paid']],
          ['docstatus', '=', 1],
        ]),
        fields: JSON.stringify(['outstanding_amount']),
        limit_page_length: 99999,
      },
    });
    const invoices = res.data.data || [];
    return invoices.reduce((sum, inv) => sum + (inv.outstanding_amount || 0), 0);
  },

  // Total décaissements en attente (somme outstanding_amount achats)
  getTotalPayable: async () => {
    const res = await apiClient.get('/resource/Purchase Invoice', {
      params: {
        filters: JSON.stringify([
          ['status', 'in', ['Unpaid', 'Overdue', 'Partly Paid']],
          ['docstatus', '=', 1],
        ]),
        fields: JSON.stringify(['outstanding_amount']),
        limit_page_length: 99999,
      },
    });
    const invoices = res.data.data || [];
    return invoices.reduce((sum, inv) => sum + (inv.outstanding_amount || 0), 0);
  },

  // Factures récentes (vente) — les 5 dernières
  getRecentSalesInvoices: async () => {
    const res = await apiClient.get('/resource/Sales Invoice', {
      params: {
        fields: JSON.stringify([
          'name',
          'customer_name',
          'posting_date',
          'grand_total',
          'outstanding_amount',
          'status',
        ]),
        filters: JSON.stringify([['docstatus', '=', 1]]),
        order_by: 'posting_date desc',
        limit_page_length: 5,
      },
    });
    return res.data.data;
  },

  // CA mensuel sur les N derniers mois
  getMonthlyRevenue: async (months = 6) => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    const startStr = startDate.toISOString().slice(0, 10);

    const res = await apiClient.get('/resource/Sales Invoice', {
      params: {
        filters: JSON.stringify([
          ['docstatus', '=', 1],
          ['posting_date', '>=', startStr],
        ]),
        fields: JSON.stringify(['posting_date', 'grand_total']),
        limit_page_length: 99999,
        order_by: 'posting_date asc',
      },
    });

    const invoices = res.data.data || [];
    const monthMap = {};
    invoices.forEach(inv => {
      const d = new Date(inv.posting_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key] = (monthMap[key] || 0) + (inv.grand_total || 0);
    });

    const labels = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, amount]) => {
        const [, m] = key.split('-');
        return { month: `${labels[parseInt(m) - 1]}`, amount: Math.round(amount * 100) / 100 };
      });
  },

  // Répartition des factures par statut
  getStatusSummary: async () => {
    const res = await apiClient.get('/resource/Sales Invoice', {
      params: {
        filters: JSON.stringify([['docstatus', '=', 1]]),
        fields: JSON.stringify(['status']),
        limit_page_length: 99999,
      },
    });

    const invoices = res.data.data || [];
    const counts = { Paid: 0, Unpaid: 0, Overdue: 0, 'Partly Paid': 0 };
    invoices.forEach(inv => { if (counts[inv.status] !== undefined) counts[inv.status]++; });

    const label = { Paid: 'Payée', Unpaid: 'Impayée', Overdue: 'En retard', 'Partly Paid': 'Partielle' };
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([s, v]) => ({ name: label[s] || s, value: v }));
  },

  // CA du mois courant
  getCurrentMonthRevenue: async () => {
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const res = await apiClient.get('/resource/Sales Invoice', {
      params: {
        filters: JSON.stringify([
          ['docstatus', '=', 1],
          ['posting_date', '>=', firstDay],
        ]),
        fields: JSON.stringify(['grand_total']),
        limit_page_length: 99999,
      },
    });
    const invoices = res.data.data || [];
    return invoices.reduce((sum, inv) => sum + (inv.grand_total || 0), 0);
  },

  // Encaissements du mois courant
  getCurrentMonthPayments: async () => {
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const res = await apiClient.get('/resource/Payment Entry', {
      params: {
        filters: JSON.stringify([
          ['docstatus', '=', 1],
          ['payment_type', '=', 'Receive'],
          ['posting_date', '>=', firstDay],
        ]),
        fields: JSON.stringify(['paid_amount']),
        limit_page_length: 99999,
      },
    });
    const entries = res.data.data || [];
    return entries.reduce((sum, e) => sum + (e.paid_amount || 0), 0);
  },

  // Nombre de factures impayées
  getUnpaidInvoiceCount: async () => {
    const res = await apiClient.get('/method/frappe.client.get_count', {
      params: {
        doctype: 'Sales Invoice',
        filters: JSON.stringify([['status', 'in', ['Unpaid', 'Overdue']], ['docstatus', '=', 1]]),
      },
    });
    return res.data.message;
  },

  // Paiements récents
  getRecentPayments: async () => {
    const res = await apiClient.get('/resource/Payment Entry', {
      params: {
        fields: JSON.stringify([
          'name',
          'payment_type',
          'party_name',
          'paid_amount',
          'posting_date',
        ]),
        filters: JSON.stringify([['docstatus', '=', 1]]),
        order_by: 'posting_date desc',
        limit_page_length: 5,
      },
    });
    return res.data.data;
  },
};

export default dashboardService;