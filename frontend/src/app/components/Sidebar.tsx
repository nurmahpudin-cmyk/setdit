import { BarChart3, Building2, GraduationCap, BookOpen, Users, Calendar, Home, X, Briefcase } from 'lucide-react';
import { Button } from './ui/button';

interface SidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'hospital-branches', label: 'Hospital Branches', icon: Building2 },
  { id: 'trainees', label: 'Trainees', icon: GraduationCap },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'trainers', label: 'Trainers', icon: Users },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'jadwal-pimpinan', label: 'Jadwal Pimpinan', icon: Briefcase },
];

export function Sidebar({ activeModule, onModuleChange, onClose, isOpen }: SidebarProps) {
  return (
    <aside
      className={[
        // Base styles
        'fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200',
        'flex flex-col z-40 transition-transform duration-300 ease-in-out',
        // Mobile: slide in/out based on isOpen; Desktop: always visible
        'lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}
    >
      {/* Mobile close button */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 lg:hidden">
        <span className="text-sm text-gray-600">Navigation</span>
        <Button variant="ghost" size="sm" onClick={onClose} className="p-1">
          <X className="h-4 w-4 text-gray-500" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;

            return (
              <Button
                key={item.id}
                variant={isActive ? 'default' : 'ghost'}
                className={`w-full justify-start h-11 ${
                  isActive
                    ? 'bg-teal-600 text-white hover:bg-teal-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
                onClick={() => onModuleChange(item.id)}
              >
                <Icon className="mr-3 h-5 w-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Button>
            );
          })}
        </nav>

        <div className="mt-6 p-4 bg-teal-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <BarChart3 className="h-5 w-5 text-teal-600 shrink-0" />
            <span className="text-sm text-teal-800">Training Network</span>
          </div>
          <p className="text-xs text-teal-600">15 active branches</p>
          <div className="mt-2 w-full bg-teal-200 rounded-full h-2">
            <div className="w-4/5 bg-teal-600 h-2 rounded-full" />
          </div>
        </div>
      </div>
    </aside>
  );
}
