import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Route, useLocation } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
  requiredRoles = [],
}: {
  path: string;
  component: () => React.JSX.Element;
  requiredRoles?: string[];
}) {
  const { user, isLoading } = useAuth();
  const [_, setLocation] = useLocation();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        {() => {
          setLocation("/auth");
          return null;
        }}
      </Route>
    );
  }

  // Check if user has required role
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-8">
            You don't have permission to access this page
          </p>
          <button 
            className="px-4 py-2 bg-primary text-white rounded-md"
            onClick={() => setLocation("/")}
          >
            Go to Dashboard
          </button>
        </div>
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
