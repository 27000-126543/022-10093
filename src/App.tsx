import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import CustomerEntry from '@/pages/CustomerEntry';
import CustomerProfile from '@/pages/CustomerProfile';
import TaskList from '@/pages/TaskList';
import VisitRecords from '@/pages/VisitRecords';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/" element={<Layout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="customers/entry" element={<CustomerEntry />} />
          <Route path="customers/:id/profile" element={<CustomerProfile />} />
          <Route path="tasks" element={<TaskList />} />
          <Route path="records" element={<VisitRecords />} />
        </Route>
      </Routes>
    </Router>
  );
}
