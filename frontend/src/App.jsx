import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CacheProvider } from './contexts/CacheContext';
import { FinanceAuthProvider } from './contexts/FinanceAuthContext';

// Layouts
import AppLayout from './components/layout/AppLayout';
import FinanceGate from './components/finance/FinanceGate';

// Pages
import Tracking from './pages/Productivity/Tracking';
import Invoices from './pages/Finance/Invoices';
import ProdAnalysis from './pages/Productivity/Analysis';
import ProdSettings from './pages/Productivity/Settings';
import ExpTransactions from './pages/Expenses/Transactions';
import ExpSettings from './pages/Expenses/Settings';
import SalesDataSources from './pages/Sales/DataSources';
import SalesAnalysis from './pages/Sales/Analysis';
import GeneralSettings from './pages/Settings/GeneralSettings';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CacheProvider>
          <FinanceAuthProvider>
            <Routes>
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Navigate to="/productivity/tracking" replace />} />
                <Route path="productivity">
                  <Route path="tracking" element={<Tracking />} />
                  <Route path="analysis" element={<ProdAnalysis />} />
                  <Route path="settings" element={<ProdSettings />} />
                </Route>

                <Route path="expenses">
                  <Route path="transactions" element={<ExpTransactions />} />
                  <Route path="settings" element={<ExpSettings />} />
                </Route>

                <Route path="finance">
                  <Route path="invoices" element={<FinanceGate><Invoices /></FinanceGate>} />
                </Route>

                <Route path="sales">
                  <Route path="data-sources" element={<SalesDataSources />} />
                  <Route path="analysis" element={<SalesAnalysis />} />
                </Route>

                <Route path="settings" element={<GeneralSettings />} />
              </Route>
            </Routes>
          </FinanceAuthProvider>
        </CacheProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
