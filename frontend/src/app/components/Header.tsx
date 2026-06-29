import { User, LogOut, Bell, Menu } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Hamburger — only on mobile */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden p-2"
            onClick={onMenuToggle}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </Button>

          <div className="w-9 h-9 bg-teal-600 rounded-lg flex items-center justify-center shrink-0">
            <div className="w-5 h-5 bg-white rounded-sm flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-teal-600 rounded-full" />
            </div>
          </div>

          <div className="hidden sm:block">
            <h1 className="text-lg text-gray-900 leading-tight">Hospital Data Management</h1>
            <p className="text-xs text-gray-500">Healthcare Analytics Dashboard</p>
          </div>

          {/* Condensed title for very small screens */}
          <div className="sm:hidden">
            <h1 className="text-sm text-gray-900">HDM Dashboard</h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="relative p-2">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-orange-400 rounded-full" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 px-2 py-1.5">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src="/placeholder-avatar.jpg" />
                  <AvatarFallback className="bg-teal-100 text-teal-700 text-xs">DR</AvatarFallback>
                </Avatar>
                <div className="text-left hidden md:block">
                  <p className="text-sm text-gray-900 leading-tight">Dr. Sarah Johnson</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
