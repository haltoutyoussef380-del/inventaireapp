import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MaterielList from './pages/MaterielList';
import InventairePage from './pages/InventairePage';
import InventaireDetails from './pages/InventaireDetails';
import UsersPage from './pages/UsersPage';
import PrinterConfig from './pages/PrinterConfig';
import Login from './pages/Login';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  console.log("App.tsx full rendering with HashRouter");
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="materiels" element={<MaterielList />} />
              <Route path="inventaire" element={<InventairePage />} />
              <Route path="inventaire/:id" element={<InventaireDetails />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="printer-config" element={<PrinterConfig />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
