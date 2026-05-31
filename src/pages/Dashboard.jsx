import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import dashboardService from '../api/dashboard';

// Formater les montants en MAD
function formatMAD(amount) {
  return new Intl.NumberFormat('fr-MA', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0) + ' MAD';
}

// Formater la date
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Badge de statut
function StatusBadge({ status }) {
  const styles = {
    Paid: 'bg-green-50 text-green-700',
    Unpaid: 'bg-orange-50 text-orange-700',
    Overdue: 'bg-red-50 text-red-700',
    'Partly Paid': 'bg-yellow-50 text-yellow-700',
    Submitted: 'bg-blue-50 text-blue-700',
  };

  const labels = {
    Paid: 'Payée',
    Unpaid: 'Impayée',
    Overdue: 'En retard',
    'Partly Paid': 'Partielle',
    Submitted: 'Soumise',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-50 text-gray-700'}`}>
      {labels[status] || status}
    </span>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    customerCount: 0,
    supplierCount: 0,
    totalReceivable: 0,
    totalPayable: 0,
    unpaidSales: [],
    recentInvoices: [],
    recentPayments: [],
    monthlyRevenue: [],
    statusBreakdown: [],
    currentMonthRevenue: 0,
    currentMonthPayments: 0,
    unpaidInvoiceCount: 0,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        customerCount,
        supplierCount,
        totalReceivable,
        totalPayable,
        unpaidSales,
        recentInvoices,
        recentPayments,
        monthlyRevenue,
        statusBreakdown,
        currentMonthRevenue,
        currentMonthPayments,
        unpaidInvoiceCount,
      ] = await Promise.all([
        dashboardService.getCustomerCount(),
        dashboardService.getSupplierCount(),
        dashboardService.getTotalReceivable(),
        dashboardService.getTotalPayable(),
        dashboardService.getUnpaidSalesInvoices(),
        dashboardService.getRecentSalesInvoices(),
        dashboardService.getRecentPayments(),
        dashboardService.getMonthlyRevenue(),
        dashboardService.getStatusSummary(),
        dashboardService.getCurrentMonthRevenue(),
        dashboardService.getCurrentMonthPayments(),
        dashboardService.getUnpaidInvoiceCount(),
      ]);

      setData({
        customerCount,
        supplierCount,
        totalReceivable,
        totalPayable,
        unpaidSales: unpaidSales || [],
        recentInvoices: recentInvoices || [],
        recentPayments: recentPayments || [],
        monthlyRevenue: monthlyRevenue || [],
        statusBreakdown: statusBreakdown || [],
        currentMonthRevenue: currentMonthRevenue || 0,
        currentMonthPayments: currentMonthPayments || 0,
        unpaidInvoiceCount: unpaidInvoiceCount || 0,
      });
    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
      setError('Impossible de charger les données. Vérifiez la connexion au serveur.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-cobilan-600 border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-gray-500">Chargement du tableau de bord…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700">{error}</p>
        <button
          onClick={loadDashboard}
          className="mt-4 text-sm font-medium text-cobilan-600 hover:underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Tableau de bord</h1>
          <p className="mt-1 text-sm text-gray-500">Vue d'ensemble de votre activité</p>
        </div>
        <button
          onClick={loadDashboard}
          className="text-sm text-gray-500 hover:text-cobilan-600 flex items-center gap-1.5 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
          Actualiser
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label="Clients"
          value={data.customerCount}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
          color="blue"
        />
        <KpiCard
          label="Fournisseurs"
          value={data.supplierCount}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          }
          color="purple"
        />
        <KpiCard
          label="CA mois en cours"
          value={formatMAD(data.currentMonthRevenue)}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="cobilan"
          isAmount
        />
        <KpiCard
          label="Paiements reçus"
          value={formatMAD(data.currentMonthPayments)}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="green"
          isAmount
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label="Créances clients"
          value={formatMAD(data.totalReceivable)}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          }
          color="orange"
          isAmount
        />
        <KpiCard
          label="Dettes fournisseurs"
          value={formatMAD(data.totalPayable)}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="red"
          isAmount
        />
        <KpiCard
          label="Factures impayées"
          value={data.unpaidInvoiceCount}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          }
          color="yellow"
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* BarChart CA mensuel */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Évolution du chiffre d'affaires</h3>
          {data.monthlyRevenue.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.monthlyRevenue} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  formatter={(val) => [formatMAD(val), 'CA']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }}
                />
                <Bar dataKey="amount" fill="#1E3A5F" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Donut répartition statuts */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Répartition des factures</h3>
          {data.statusBreakdown.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data.statusBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.statusBreakdown.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name] || '#D1D5DB'} />
                  ))}
                </Pie>
                <Tooltip formatter={(val, name) => [val, name]} contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tableaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dernières factures */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Dernières factures</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {data.recentInvoices.length === 0 ? (
              <p className="px-6 py-8 text-sm text-gray-400 text-center">Aucune facture</p>
            ) : (
              data.recentInvoices.map((inv) => (
                <div key={inv.name} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{inv.customer_name}</p>
                    <p className="text-xs text-gray-500">{inv.name} · {formatDate(inv.posting_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatMAD(inv.grand_total)}</p>
                    <StatusBadge status={inv.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Factures impayées */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Factures impayées</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {data.unpaidSales.length === 0 ? (
              <p className="px-6 py-8 text-sm text-gray-400 text-center">Aucune facture impayée</p>
            ) : (
              data.unpaidSales.map((inv) => (
                <div key={inv.name} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{inv.customer_name || inv.customer}</p>
                    <p className="text-xs text-gray-500">{inv.name} · Éch. {formatDate(inv.due_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatMAD(inv.outstanding_amount)}</p>
                    <StatusBadge status={inv.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Derniers paiements */}
        <div className="bg-white rounded-xl border border-gray-200 lg:col-span-2">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Derniers paiements</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {data.recentPayments.length === 0 ? (
              <p className="px-6 py-8 text-sm text-gray-400 text-center">Aucun paiement récent</p>
            ) : (
              data.recentPayments.map((pay) => (
                <div key={pay.name} className="px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      pay.payment_type === 'Receive'
                        ? 'bg-green-50 text-green-600'
                        : 'bg-red-50 text-red-600'
                    }`}>
                      {pay.payment_type === 'Receive' ? '↓' : '↑'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{pay.party_name || pay.name}</p>
                      <p className="text-xs text-gray-500">
                        {pay.payment_type === 'Receive' ? 'Encaissement' : 'Décaissement'} · {formatDate(pay.posting_date)}
                      </p>
                    </div>
                  </div>
                  <p className={`text-sm font-semibold ${
                    pay.payment_type === 'Receive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {pay.payment_type === 'Receive' ? '+' : '-'}{formatMAD(pay.paid_amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const STATUS_COLORS = {
  'Payée': '#16A34A',
  'Impayée': '#EA580C',
  'En retard': '#DC2626',
  'Partielle': '#CA8A04',
};

// Composant KPI Card
function KpiCard({ label, value, icon, color, isAmount }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    cobilan: 'bg-cobilan-50 text-cobilan-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
      </div>
      <p className={`mt-3 font-semibold text-gray-900 ${isAmount ? 'text-lg' : 'text-2xl'}`}>
        {value}
      </p>
    </div>
  );
}