import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import AIAssistantWidget from './AIAssistantWidget';

const Layout = () => {
  return (
    <div className="flex min-h-screen bg-background text-on-background font-body-md antialiased selection:bg-primary-container selection:text-white">
      <Sidebar />
      <div className="flex-1 ml-0 md:ml-sidebar-width flex flex-col min-w-0 h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-container-padding">
          <Outlet />
        </main>
      </div>
      <AIAssistantWidget />
    </div>
  );
};

export default Layout;
