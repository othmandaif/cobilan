import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import PageTransition from './components/PageTransition';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CustomerList from './pages/customers/CustomerList';
import CustomerDetail from './pages/customers/CustomerDetail';
import CustomerForm from './pages/customers/CustomerForm';
import InvoiceList from './pages/invoices/InvoiceList';
import InvoiceDetail from './pages/invoices/InvoiceDetail';
import InvoiceForm from './pages/invoices/InvoiceForm';
import PurchaseInvoiceList from './pages/purchase-invoices/PurchaseInvoiceList';
import PurchaseInvoiceDetail from './pages/purchase-invoices/PurchaseInvoiceDetail';
import PurchaseInvoiceForm from './pages/purchase-invoices/PurchaseInvoiceForm';
import SupplierList from './pages/suppliers/SupplierList';
import SupplierDetail from './pages/suppliers/SupplierDetail';
import SupplierForm from './pages/suppliers/SupplierForm';
import ItemList from './pages/items/ItemList';
import ItemDetail from './pages/items/ItemDetail';
import ItemForm from './pages/items/ItemForm';
import Comptabilite from './pages/accounting/Comptabilite';
import Rapports from './pages/reports/Rapports';
import PaymentList from './pages/payments/PaymentList';
import PaymentDetail from './pages/payments/PaymentDetail';
import PaymentForm from './pages/payments/PaymentForm';
import Settings from './pages/settings/Settings';
import InvoicePrint from './pages/print/InvoicePrint';
import PurchaseInvoicePrint from './pages/print/PurchaseInvoicePrint';
import Relances from './pages/invoices/Relances';

function AnimatedOutlet() {
  const location = useLocation();
  return (
    <PageTransition key={location.pathname}>
      <Layout />
    </PageTransition>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute><AnimatedOutlet /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<CustomerList />} />
            <Route path="/clients/nouveau" element={<CustomerForm />} />
            <Route path="/clients/:id" element={<CustomerDetail />} />
            <Route path="/clients/:id/modifier" element={<CustomerForm />} />
            <Route path="/fournisseurs" element={<SupplierList />} />
            <Route path="/fournisseurs/nouveau" element={<SupplierForm />} />
            <Route path="/fournisseurs/:id" element={<SupplierDetail />} />
            <Route path="/fournisseurs/:id/modifier" element={<SupplierForm />} />
            <Route path="/factures-vente" element={<InvoiceList />} />
            <Route path="/factures-vente/nouvelle" element={<InvoiceForm />} />
            <Route path="/factures-vente/:id" element={<InvoiceDetail />} />
            <Route path="/factures-vente/:id/modifier" element={<InvoiceForm />} />
            <Route path="/factures-achat" element={<PurchaseInvoiceList />} />
            <Route path="/factures-achat/nouvelle" element={<PurchaseInvoiceForm />} />
            <Route path="/factures-achat/:id" element={<PurchaseInvoiceDetail />} />
            <Route path="/factures-achat/:id/modifier" element={<PurchaseInvoiceForm />} />
            <Route path="/articles" element={<ItemList />} />
            <Route path="/articles/nouveau" element={<ItemForm />} />
            <Route path="/articles/:id" element={<ItemDetail />} />
            <Route path="/articles/:id/modifier" element={<ItemForm />} />
            <Route path="/comptabilite" element={<Comptabilite />} />
            <Route path="/rapports" element={<Rapports />} />
            <Route path="/paiements" element={<PaymentList />} />
            <Route path="/paiements/nouveau" element={<PaymentForm />} />
            <Route path="/paiements/:id" element={<PaymentDetail />} />
            <Route path="/parametres" element={<Settings />} />
            <Route path="/relances" element={<Relances />} />
          </Route>
          <Route path="/factures-vente/:id/print" element={<ProtectedRoute><InvoicePrint /></ProtectedRoute>} />
          <Route path="/factures-achat/:id/print" element={<ProtectedRoute><PurchaseInvoicePrint /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}