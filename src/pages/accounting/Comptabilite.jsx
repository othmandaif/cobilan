import { useState, useEffect, useCallback } from 'react';
import accountingService from '../../api/accounting';
import ChartOfAccounts from './ChartOfAccounts';
import JournalEntries from './JournalEntries';
import GeneralLedger from './GeneralLedger';
import TrialBalance from './TrialBalance';

const TABS = [
  { id: 'chart', label: 'Plan comptable', icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  )},
  { id: 'journal', label: 'Écritures', icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
    </svg>
  )},
  { id: 'ledger', label: 'Grand livre', icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  )},
  { id: 'balance', label: 'Balance', icon: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  )},
];

export default function Comptabilite() {
  const [activeTab, setActiveTab] = useState('chart');
  const [companies, setCompanies] = useState([]);
  const [fiscalYears, setFiscalYears] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedFiscalYear, setSelectedFiscalYear] = useState('');

  useEffect(() => {
    loadMeta();
  }, []);

  const loadMeta = async () => {
    try {
      const [comp, fy] = await Promise.all([
        accountingService.getCompanies(),
        accountingService.getFiscalYears(),
      ]);
      setCompanies(comp || []);
      setFiscalYears(fy || []);
      if (comp?.length > 0) setSelectedCompany(comp[0].name);
      if (fy?.length > 0) setSelectedFiscalYear(fy[0].name);
    } catch (err) {
      console.error('Erreur chargement meta:', err);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Comptabilité</h1>
          <p className="mt-1 text-sm text-gray-500">Plan comptable, écritures, grand livre et balance</p>
        </div>

        {/* Filtres globaux */}
        <div className="flex gap-2 flex-wrap">
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cobilan-500"
          >
            {companies.map(c => <option key={c.name} value={c.name}>{c.company_name || c.name}</option>)}
          </select>
          {(activeTab === 'balance') && (
            <select
              value={selectedFiscalYear}
              onChange={(e) => setSelectedFiscalYear(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cobilan-500"
            >
              {fiscalYears.map(fy => <option key={fy.name} value={fy.name}>{fy.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
              activeTab === tab.id
                ? 'bg-white text-cobilan-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Contenu des tabs */}
      {activeTab === 'chart' && <ChartOfAccounts company={selectedCompany} />}
      {activeTab === 'journal' && <JournalEntries company={selectedCompany} />}
      {activeTab === 'ledger' && <GeneralLedger company={selectedCompany} />}
      {activeTab === 'balance' && <TrialBalance company={selectedCompany} fiscalYear={selectedFiscalYear} />}
    </div>
  );
}
