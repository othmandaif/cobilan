import apiClient from './client';

const relanceService = {
  getOverdueInvoices: async () => {
    const today = new Date().toISOString().split('T')[0];
    const filters = [
      ['outstanding_amount', '>', 0],
      ['due_date', '<', today],
      ['docstatus', '=', 1],
    ];
    const params = {
      fields: JSON.stringify([
        'name', 'customer', 'customer_name', 'posting_date',
        'due_date', 'grand_total', 'outstanding_amount', 'status',
      ]),
      filters: JSON.stringify(filters),
      order_by: 'due_date asc',
      limit_page_length: 500,
    };
    const res = await apiClient.get('/resource/Sales Invoice', { params });
    return res.data.data || [];
  },

  getRelanceCounts: async (invoiceNames) => {
    if (!invoiceNames.length) return {};
    const res = await apiClient.get('/resource/Communication', {
      params: {
        fields: JSON.stringify(['reference_name', 'name']),
        filters: JSON.stringify([
          ['reference_doctype', '=', 'Sales Invoice'],
          ['reference_name', 'in', invoiceNames],
          ['sent_or_received', '=', 'Sent'],
        ]),
        limit_page_length: 5000,
      },
    });
    const comms = res.data.data || [];
    const counts = {};
    for (const c of comms) {
      counts[c.reference_name] = (counts[c.reference_name] || 0) + 1;
    }
    return counts;
  },

  getCustomerEmail: async (customerName) => {
    const res = await apiClient.get(`/resource/Customer/${encodeURIComponent(customerName)}`, {
      params: { fields: JSON.stringify(['email_id', 'customer_name']) },
    });
    return res.data.data?.email_id || null;
  },

  sendRelance: async ({ invoice, recipient, subject, content }) => {
    const res = await apiClient.post('/method/frappe.core.doctype.communication.email.make', {
      recipients: recipient,
      subject,
      content,
      doctype: 'Sales Invoice',
      name: invoice.name,
      send_email: true,
      print_format: 'Standard',
    });
    return res.data;
  },
};

export default relanceService;
