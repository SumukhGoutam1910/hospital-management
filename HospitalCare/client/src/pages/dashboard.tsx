import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import StatsCard from "@/components/stats/stats-card";
import { useAuth } from "@/hooks/use-auth";
import { Appointment, Bed } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock, Hotel, Users, FileText } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const { user } = useAuth();
  
  // Fetch appointments
  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });
  
  // Fetch beds (for doctors and nurses)
  const { data: beds = [] } = useQuery<Bed[]>({
    queryKey: ["/api/beds"],
    enabled: user?.role === "doctor" || user?.role === "nurse",
  });
  
  // Calculate statistics
  const todayDate = new Date().toISOString().split('T')[0];
  
  const todayAppointments = appointments.filter(
    appointment => new Date(appointment.appointmentDate).toISOString().split('T')[0] === todayDate
  );
  
  const availableBeds = beds.filter(bed => bed.status === "available").length;
  const totalBeds = beds.length;
  
  // Get bed occupancy by ward
  const bedsByWard = beds.reduce((acc, bed) => {
    if (!acc[bed.ward]) {
      acc[bed.ward] = { total: 0, available: 0 };
    }
    acc[bed.ward].total += 1;
    if (bed.status === "available") {
      acc[bed.ward].available += 1;
    }
    return acc;
  }, {} as Record<string, { total: number, available: number }>);
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };
  
  return (
    <DashboardLayout title="Dashboard">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard 
          title="Today's Appointments" 
          value={todayAppointments.length}
          icon={<CalendarClock className="h-6 w-6" />}
          trend={{
            value: "8%",
            label: "from last week",
            positive: true
          }}
        />
        
        {(user?.role === "doctor" || user?.role === "nurse") && (
          <StatsCard 
            title="Available Beds" 
            value={`${availableBeds}/${totalBeds}`}
            icon={<Hotel className="h-6 w-6" />}
            trend={{
              value: "5%",
              label: "from yesterday",
              positive: false
            }}
          />
        )}
        
        <StatsCard 
          title="New Patients" 
          value="8"
          icon={<Users className="h-6 w-6" />}
          trend={{
            value: "12%",
            label: "from last week",
            positive: true
          }}
        />
        
        <StatsCard 
          title="Pending Reports" 
          value="5"
          icon={<FileText className="h-6 w-6" />}
        />
      </div>

      {/* Upcoming Appointments */}
      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle>Today's Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {todayAppointments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {todayAppointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 rounded-full bg-blue-100 text-blue-500">
                            <AvatarFallback>P</AvatarFallback>
                          </Avatar>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">Patient {appointment.patientId}</div>
                            <div className="text-sm text-gray-500">#{appointment.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(appointment.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{appointment.type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={appointment.status === "scheduled" ? "success" : appointment.status === "cancelled" ? "destructive" : "outline"}>
                          {appointment.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-primary hover:text-primary-dark mr-3">View</button>
                        <button className="text-gray-600 hover:text-gray-900">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              No appointments scheduled for today
            </div>
          )}
          
          <div className="mt-4 text-right">
            <button className="text-primary hover:text-primary-dark text-sm font-medium flex items-center justify-end w-full md:w-auto">
              View all appointments
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity and Bed Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bed Status (only for doctors and nurses) */}
        {(user?.role === "doctor" || user?.role === "nurse") && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Bed Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-gray-500">Available</div>
                  <div className="text-lg font-semibold text-gray-800">{availableBeds} beds</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Occupied</div>
                  <div className="text-lg font-semibold text-gray-800">{totalBeds - availableBeds} beds</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Total</div>
                  <div className="text-lg font-semibold text-gray-800">{totalBeds} beds</div>
                </div>
              </div>
              
              <div className="mt-6 space-y-4">
                {Object.entries(bedsByWard).map(([ward, data]) => (
                  <div key={ward} className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{ward.charAt(0).toUpperCase() + ward.slice(1)} Ward</span>
                      <span className="text-sm text-gray-500">{data.available}/{data.total} available</span>
                    </div>
                    <Progress value={(data.available / data.total) * 100} className="h-2" />
                  </div>
                ))}
              </div>
              
              <div className="mt-4 text-right">
                <button className="text-primary hover:text-primary-dark text-sm font-medium flex items-center justify-end w-full md:w-auto">
                  View bed management
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flow-root">
              <ul className="-mb-8">
                <li>
                  <div className="relative pb-8">
                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center ring-8 ring-white">
                          <FileText className="text-blue-500 h-4 w-4" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-800">New prescription uploaded for <span className="font-medium">Patient</span></p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time>10 minutes ago</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="relative pb-8">
                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center ring-8 ring-white">
                          <CalendarClock className="text-green-500 h-4 w-4" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-800">Appointment confirmed with <span className="font-medium">Doctor</span></p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time>30 minutes ago</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="relative pb-8">
                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center ring-8 ring-white">
                          <Hotel className="text-red-500 h-4 w-4" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-800">ICU bed assigned to <span className="font-medium">Patient</span></p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time>2 hours ago</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="relative pb-0">
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center ring-8 ring-white">
                          <Users className="text-purple-500 h-4 w-4" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-800">New patient registered: <span className="font-medium">Patient</span></p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time>3 hours ago</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
