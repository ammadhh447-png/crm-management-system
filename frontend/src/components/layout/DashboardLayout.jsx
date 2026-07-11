import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import AIAssistant from '../ai/AIAssistant';

const DashboardLayout = () => (
  <div className="flex h-screen overflow-hidden bg-slate-50">
    <Sidebar />
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
        <div className="mx-auto w-full max-w-full">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
    <AIAssistant />
  </div>
);

export default DashboardLayout;
