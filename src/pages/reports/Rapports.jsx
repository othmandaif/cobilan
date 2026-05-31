import { useState, useEffect } from 'react';
import reportsService from '../../api/reports';
import ReceivableReport from './ReceivableReport';
import PayableReport from './PayableReport';
import ProfitLossReport from './ProfitLossReport';
import BalanceSheetReport from './BalanceSheetReport';
import SalesRegisterReport from './SalesRegisterReport';
import PurchaseRegisterReport from './PurchaseRegisterReport';

const TABS = [
  {
    id: 'receivable', label: 'Balance clients', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    id: 'payable', label: 'Balance fournisseurs', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
  },
  {
    id: 'pl', label: 'Compte de résultat', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
  {
    id: 'bs', label: 'Bilan', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
      </svg>
    ),
  },
  {
    id: 'sales_reg', label: 'Registre ventes', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    id: 'purchase_reg', label: 'Registre achats', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
      </svg>
    ),
  },
];

export default function Rapports() {
  const [activeTab, setActiveTab] = useState('receivable');
  const [companies, setCompanies] = useState([]);
  const [fiscalYears, setFiscalYears] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedFiscalYear, setSelectedFiscalYear] = useState('');

  useEffect(() => {
    reportsService.getCompanies().then(data => {
      setCompanies(data || []);
      if (data?.length > 0) setSelectedCompany(data[0].name);
    }).catch(() => {});
    reportsService.getFiscalYears().then(data => {
      setFiscalYears(data || []);
      if (data?.length > 0) setSelectedFiscalYear(data[0].name);
    }).catch(() => {});
  }, []);

  const needsFiscalYear = ['pl', 'bs'];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Rapports</h1>
          <p className="mt-1 text-sm text-gray-500">Analyses financières et registres comptables</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cobilan-500">
            {companies.map(c => <option key={c.name} value={c.name}>{c.company_name || c.name}</option>)}
          </select>
          {needsFiscalYear.includes(activeTab) && (
            <select value={selectedFiscalYear} onChange={(e) => setSelectedFiscalYear(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cobilan-500">
              {fiscalYears.map(fy => <option key={fy.name} value={fy.name}>{fy.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Tabs — scrollable sur mobile */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl min-w-max">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition whitespace-nowrap ${
                activeTab === tab.id ? 'bg-white text-cobilan-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}>
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      {activeTab === 'receivable' && <ReceivableReport company={selectedCompany} />}
      {activeTab === 'payable' && <PayableReport company={selectedCompany} />}
      {activeTab === 'pl' && <ProfitLossReport company={selectedCompany} fiscalYear={selectedFiscalYear} />}
      {activeTab === 'bs' && <BalanceSheetReport company={selectedCompany} fiscalYear={selectedFiscalYear} />}
      {activeTab === 'sales_reg' && <SalesRegisterReport company={selectedCompany} />}
      {activeTab === 'purchase_reg' && <PurchaseRegisterReport company={selectedCompany} />}
    </div>
  );
}
