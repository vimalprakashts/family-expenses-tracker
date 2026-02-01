import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      <div className="flex-1 flex flex-col lg:ml-0">
        <Header onMenuClick={() => setIsDrawerOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 overflow-auto pb-20 lg:pb-6">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
