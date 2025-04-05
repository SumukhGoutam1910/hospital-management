import React from "react";
import Header from "./header";
import Sidebar from "./sidebar";
import { useAuth } from "@/hooks/use-auth";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export default function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  const { user } = useAuth();
  
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
            {description && <p className="text-gray-600">{description || `Welcome back, ${user?.fullName}`}</p>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
