import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import NotificationToast from './components/NotificationToast';

// Pages
import Dashboard from './pages/Dashboard';
import TicketsPage from './pages/TicketsPage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import AssetsPage from './pages/AssetsPage';
import LicensesPage from './pages/LicensesPage';
import OnboardingPage from './pages/OnboardingPage';
import OffboardingPage from './pages/OffboardingPage';
import ProcurementPage from './pages/ProcurementPage';
import FloorplanPage from './pages/FloorplanPage';
import NetworkDiscoveryPage from './pages/NetworkDiscoveryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AuditLogsPage from './pages/AuditLogsPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'tickets':
        return <TicketsPage />;
      case 'kb':
        return <KnowledgeBasePage />;
      case 'assets':
        return <AssetsPage />;
      case 'licenses':
        return <LicensesPage />;
      case 'onboarding':
        return <OnboardingPage />;
      case 'offboarding':
        return <OffboardingPage />;
      case 'procurement':
        return <ProcurementPage />;
      case 'floorplan':
        return <FloorplanPage />;
      case 'discovery':
        return <NetworkDiscoveryPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'audit-logs':
        return <AuditLogsPage />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          <main className="flex-1 overflow-y-auto bg-slate-950">
            {renderActivePage()}
          </main>
        </div>
        <NotificationToast />
      </div>
    </AuthProvider>
  );
}
