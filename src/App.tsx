import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
// Import page components (create placeholder files first)
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
      <Layout>
        <Routes>
          {/* Default route to Dashboard or a Login page */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/services" element={<Services />} />
          <Route path="/reminders" element={<Reminders />} />
          {/* TODO: Add protected routes based on user roles */}
          {/* TODO: Add a Not Found page (404) */}
        </Routes>
      </Layout>
    </Router>
  );
}

export default App; 