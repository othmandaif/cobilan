import apiClient from './client';

const reportsService = {

  // Appel générique pour tous les rapports ERPNext
run: async (reportName, filters) => {
  const body = new URLSearchParams();
  body.append('report_name', reportName);

  // ERPNext v16 attend filters comme JSON stringifié
  body.append('filters', JSON.stringify(filters));

  // ET aussi chaque filtre de date directement au niveau racine
  if (filters.from_date) body.append('from_date', filters.from_date);
  if (filters.to_date) body.append('to_date', filters.to_date);
  if (filters.from_fiscal_year) body.append('from_fiscal_year', filters.from_fiscal_year);
  if (filters.to_fiscal_year) body.append('to_fiscal_year', filters.to_fiscal_year);
  if (filters.company) body.append('company', filters.company);
  if (filters.periodicity) body.append('periodicity', filters.periodicity);

  const res = await fetch('/api/method/frappe.desk.query_report.run', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      Authorization: `token 61b215bd3ef8221:b33ce5a0113e4ac`,
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(`Request failed: ${res.status}`);
    error.response = { status: res.status, data: errorData };
    throw error;
  }

  const data = await res.json();
  return data.message;
},
  // Récupérer les dates d'un exercice fiscal
  getFiscalYearDates: async (fiscalYear) => {
    const res = await apiClient.get(`/resource/Fiscal Year/${encodeURIComponent(fiscalYear)}`);
    return res.data.data;
  },

  // ── RAPPORTS CLIENTS ──

  getAccountsReceivable: async ({ company, reportDate, ageingBasedOn = 'Due Date' }) => {
    return reportsService.run('Accounts Receivable', {
      company,
      report_date: reportDate,
      ageing_based_on: ageingBasedOn,
      range1: 30,
      range2: 60,
      range3: 90,
      range4: 120,
    });
  },

  getAccountsReceivableSummary: async ({ company, reportDate }) => {
    return reportsService.run('Accounts Receivable Summary', {
      company,
      report_date: reportDate,
      ageing_based_on: 'Due Date',
    });
  },

  getSalesRegister: async ({ company, fromDate, toDate }) => {
    return reportsService.run('Sales Register', {
      company,
      from_date: fromDate,
      to_date: toDate,
    });
  },

  // ── RAPPORTS FOURNISSEURS ──

  getAccountsPayable: async ({ company, reportDate }) => {
    return reportsService.run('Accounts Payable', {
      company,
      report_date: reportDate,
      ageing_based_on: 'Due Date',
      range1: 30,
      range2: 60,
      range3: 90,
      range4: 120,
    });
  },

  getAccountsPayableSummary: async ({ company, reportDate }) => {
    return reportsService.run('Accounts Payable Summary', {
      company,
      report_date: reportDate,
    });
  },

  getPurchaseRegister: async ({ company, fromDate, toDate }) => {
    return reportsService.run('Purchase Register', {
      company,
      from_date: fromDate,
      to_date: toDate,
    });
  },

  // ── RAPPORTS FINANCIERS ──
  // ERPNext v16 exige from_fiscal_year + to_fiscal_year + from_date + to_date

getBalanceSheet: async ({ company, fiscalYear, periodicity = 'Yearly' }) => {
  const fy = await reportsService.getFiscalYearDates(fiscalYear);
  return reportsService.run('Balance Sheet', {
    company,
    from_fiscal_year: fiscalYear,
    to_fiscal_year: fiscalYear,
    periodicity,
    accumulated_values: 1,
    from_date: fy.year_start_date,
    to_date: fy.year_end_date,
    period_start_date: fy.year_start_date,
    period_end_date: fy.year_end_date,
  });
},

getProfitAndLoss: async ({ company, fiscalYear, periodicity = 'Monthly' }) => {
  const fy = await reportsService.getFiscalYearDates(fiscalYear);
  return reportsService.run('Profit and Loss Statement', {
    company,
    from_fiscal_year: fiscalYear,
    to_fiscal_year: fiscalYear,
    periodicity,
    accumulated_values: 0,
    from_date: fy.year_start_date,
    to_date: fy.year_end_date,
    period_start_date: fy.year_start_date,
    period_end_date: fy.year_end_date,
  });
},

  getCashFlow: async ({ company, fiscalYear, periodicity = 'Monthly' }) => {
    const fy = await reportsService.getFiscalYearDates(fiscalYear);
    return reportsService.run('Cash Flow', {
      company,
      from_fiscal_year: fiscalYear,
      to_fiscal_year: fiscalYear,
      periodicity,
      from_date: fy.year_start_date,
      to_date: fy.year_end_date,
    });
  },

  // ── META ──

  getCompanies: async () => {
    const res = await apiClient.get('/resource/Company', {
      params: { fields: JSON.stringify(['name', 'company_name']), limit_page_length: 100 },
    });
    return res.data.data;
  },

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
};

export default reportsService;