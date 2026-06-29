import { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardModule } from './components/modules/DashboardModule';
import { HospitalBranchesModule } from './components/modules/HospitalBranchesModule';
import { TraineesModule } from './components/modules/TraineesModule';
import { CoursesModule } from './components/modules/CoursesModule';
import { TrainersModule } from './components/modules/TrainersModule';
import { ScheduleModule } from './components/modules/ScheduleModule';
import { JadwalPimpinanModule } from './components/modules/JadwalPimpinanModule';

export default function App() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleModuleChange = (module: string) => {
    setActiveModule(module);
    setSidebarOpen(false);
  };

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardModule />;
      case 'hospital-branches':
        return <HospitalBranchesModule />;
      case 'trainees':
        return <TraineesModule />;
      case 'courses':
        return <CoursesModule />;
      case 'trainers':
        return <TrainersModule />;
      case 'schedule':
        return <ScheduleModule />;
      case 'jadwal-pimpinan':
        return <JadwalPimpinanModule />;
      default:
        return <DashboardModule />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex">
        <Sidebar
          activeModule={activeModule}
          onModuleChange={handleModuleChange}
          onClose={() => setSidebarOpen(false)}
          isOpen={sidebarOpen}
        />
        <main className="flex-1 p-4 md:p-6 lg:ml-64 min-w-0">
          {renderActiveModule()}
        </main>
      </div>
    </div>
  );
}
