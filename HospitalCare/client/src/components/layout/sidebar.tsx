import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href: string;
  icon: JSX.Element;
  label: string;
  active?: boolean;
}

const NavItem = ({ href, icon, label, active }: NavItemProps) => {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center px-3 py-2 mt-1 text-sm font-medium rounded-md",
          active
            ? "bg-primary-light text-primary"
            : "text-gray-700 hover:bg-gray-100"
        )}
      >
        {icon}
        {label}
      </a>
    </Link>
  );
};

export default function Sidebar() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  const isActive = (path: string) => location === path;
  
  return (
    <aside className="bg-white w-64 border-r border-gray-200 flex flex-col">
      <div className="p-4">
        <div className="bg-gray-100 rounded-lg p-2 flex items-center">
          <Search className="text-gray-500 h-4 w-4 mr-2" />
          <Input 
            type="text" 
            placeholder="Search..." 
            className="bg-transparent border-none focus:outline-none text-sm flex-1 h-6 p-0"
          />
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto">
        {/* Main Navigation - visible to all users */}
        <div className="px-2">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Main
          </div>
          
          <NavItem 
            href="/" 
            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-lg h-5 w-5"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>} 
            label="Dashboard" 
            active={isActive("/")}
          />
          
          <NavItem 
            href="/appointments" 
            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-lg h-5 w-5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>} 
            label="Appointments" 
            active={isActive("/appointments")}
          />
          
          {/* Conditionally show items based on role */}
          {(user?.role === "doctor" || user?.role === "nurse") && (
            <NavItem 
              href="/beds" 
              icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-lg h-5 w-5"><path d="M2 4v16" /><path d="M22 4v16" /><path d="M2 8h20" /><path d="M2 16h20" /><path d="M2 12h20" /></svg>} 
              label="Bed Management" 
              active={isActive("/beds")}
            />
          )}
          
          <NavItem 
            href="/prescriptions" 
            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-lg h-5 w-5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>} 
            label="Prescriptions" 
            active={isActive("/prescriptions")}
          />
          
          <NavItem 
            href="/doctor-schedule" 
            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-lg h-5 w-5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>} 
            label="Doctor Schedule" 
            active={isActive("/doctor-schedule")}
          />
        </div>
        
        {/* System Navigation */}
        <div className="px-2 mt-6">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            System
          </div>
          
          <NavItem 
            href="/settings" 
            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-lg h-5 w-5"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>} 
            label="Settings" 
            active={isActive("/settings")}
          />
          
          <NavItem 
            href="/help" 
            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-lg h-5 w-5"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>} 
            label="Help & Support" 
            active={isActive("/help")}
          />
        </div>
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <button 
          onClick={() => { /* handled by auth provider */ }}
          className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-lg h-4 w-4"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
