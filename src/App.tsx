import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
// Import page components (create placeholder files first)
import Login from './pages/Login';
import Clients from './pages/Clients';
import Vehicles from './pages/Vehicles';
import Inventory from './pages/Inventory';
import Services from './pages/Services';
import Reminders from './pages/Reminders';
import Dashboard from './pages/Dashboard';

function App() {
  // TODO: Add Supabase Auth context provider here

  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes wrapped by Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/vehicles" element={<Vehicles />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/services" element={<Services />} />
              <Route path="/reminders" element={<Reminders />} />
              {/* TODO: Add role-specific routes if needed */}
              {/* TODO: Add a Not Found page (404) inside protected routes */}
            </Route>
          </Route>

          {/* TODO: Add a public Not Found page (404) */}
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App; 