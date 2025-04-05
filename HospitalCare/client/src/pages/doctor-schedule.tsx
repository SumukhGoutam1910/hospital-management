import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DoctorSchedule, User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Weekdays array for schedule display
const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

// Schedule form schema
const scheduleSchema = z.object({
  doctorId: z.number(),
  day: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  activityType: z.string(),
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

// Schedule entry component
interface ScheduleEntryProps {
  schedule: DoctorSchedule;
  doctorName?: string;
  color: string;
}

const ScheduleEntry = ({ schedule, doctorName, color }: ScheduleEntryProps) => {
  return (
    <div className={`p-2 ${color} rounded text-sm`}>
      <div className="font-semibold">{doctorName || `Dr. ID ${schedule.doctorId}`}</div>
      <div className="text-xs">{schedule.activityType}</div>
      <div className="text-xs mt-1">{schedule.startTime} - {schedule.endTime}</div>
    </div>
  );
};

// Get color class based on activity type
const getColorClass = (activityType: string) => {
  switch (activityType.toLowerCase()) {
    case "clinic":
      return "bg-blue-100 text-blue-800";
    case "surgery":
      return "bg-green-100 text-green-800";
    case "rounds":
      return "bg-purple-100 text-purple-800";
    case "meeting":
      return "bg-yellow-100 text-yellow-800";
    case "emergency":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Schedule form component
const ScheduleForm = ({ onClose, existingSchedule }: { onClose: () => void, existingSchedule?: DoctorSchedule }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch doctors if nurse
  const { data: doctors = [] } = useQuery<User[]>({
    queryKey: ["/api/users/doctors"],
    enabled: user?.role === "nurse",
  });
  
  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: existingSchedule ? {
      ...existingSchedule
    } : {
      doctorId: user?.role === "doctor" ? user.id : undefined,
      day: "monday",
      startTime: "09:00",
      endTime: "10:00",
      activityType: "clinic",
    },
  });
  
  const createScheduleMutation = useMutation({
    mutationFn: async (data: ScheduleFormValues) => {
      if (existingSchedule) {
        const response = await apiRequest("PUT", `/api/schedules/${existingSchedule.id}`, data);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/schedules", data);
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: existingSchedule ? "Schedule Updated" : "Schedule Created",
        description: existingSchedule 
          ? "The schedule has been updated successfully" 
          : "New schedule entry has been created",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${existingSchedule ? "update" : "create"} schedule: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: ScheduleFormValues) => {
    createScheduleMutation.mutate(data);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {user?.role === "nurse" && (
          <FormField
            control={form.control}
            name="doctorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Doctor</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id.toString()}>
                        Dr. {doctor.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <FormField
          control={form.control}
          name="day"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Day</FormLabel>
              <Select 
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="monday">Monday</SelectItem>
                  <SelectItem value="tuesday">Tuesday</SelectItem>
                  <SelectItem value="wednesday">Wednesday</SelectItem>
                  <SelectItem value="thursday">Thursday</SelectItem>
                  <SelectItem value="friday">Friday</SelectItem>
                  <SelectItem value="saturday">Saturday</SelectItem>
                  <SelectItem value="sunday">Sunday</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="activityType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Activity Type</FormLabel>
              <Select 
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select activity" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="clinic">Outpatient Clinic</SelectItem>
                  <SelectItem value="surgery">Surgery</SelectItem>
                  <SelectItem value="rounds">Rounds</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="emergency">Emergency Consult</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createScheduleMutation.isPending}>
            {createScheduleMutation.isPending 
              ? (existingSchedule ? "Updating..." : "Creating...") 
              : (existingSchedule ? "Update Schedule" : "Create Schedule")}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default function DoctorSchedulePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<DoctorSchedule | undefined>(undefined);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("all");
  const [viewMode, setViewMode] = useState<string>("weekly");
  
  // Get the current week dates for display
  const getWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday
    const diff = currentDay === 0 ? 6 : currentDay - 1; // Adjust to make Monday the first day
    
    const monday = new Date(today);
    monday.setDate(today.getDate() - diff);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push(date);
    }
    
    return weekDates;
  };
  
  const weekDates = getWeekDates();
  
  // Generate time slots for the schedule
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 18; hour++) {
      const hourStr = hour.toString().padStart(2, '0');
      slots.push(`${hourStr}:00`);
    }
    return slots;
  };
  
  const timeSlots = generateTimeSlots();
  
  // Fetch schedules
  const { data: schedules = [], isLoading: isLoadingSchedules } = useQuery<DoctorSchedule[]>({
    queryKey: ["/api/schedules"],
  });
  
  // Fetch doctors if not a patient
  const { data: doctors = [] } = useQuery<User[]>({
    queryKey: ["/api/users/doctors"],
    enabled: user?.role !== "patient",
  });
  
  // Filter schedules based on selected doctor
  const filteredSchedules = schedules.filter(schedule => {
    return selectedDoctor === "all" || schedule.doctorId.toString() === selectedDoctor;
  });
  
  // Group schedules by day for weekly view
  const schedulesByDay = weekdays.reduce((acc, day) => {
    acc[day] = filteredSchedules.filter(schedule => schedule.day === day);
    return acc;
  }, {} as Record<string, DoctorSchedule[]>);
  
  // Group schedules by time slot for grid view
  const getSchedulesForTimeSlot = (timeSlot: string, day: string) => {
    return schedulesByDay[day]?.filter(schedule => {
      return schedule.startTime <= timeSlot && schedule.endTime > timeSlot;
    }) || [];
  };
  
  // Get doctor name by ID
  const getDoctorName = (doctorId: number): string | undefined => {
    const doctor = doctors.find(doc => doc.id === doctorId);
    return doctor ? doctor.fullName : undefined;
  };
  
  // Handle editing a schedule
  const handleEditSchedule = (schedule: DoctorSchedule) => {
    setSelectedSchedule(schedule);
    setIsDialogOpen(true);
  };
  
  // Handle deleting a schedule
  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/schedules/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Schedule Deleted",
        description: "The schedule entry has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete schedule: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleDeleteSchedule = (id: number) => {
    if (confirm("Are you sure you want to delete this schedule entry?")) {
      deleteScheduleMutation.mutate(id);
    }
  };
  
  return (
    <DashboardLayout
      title="Doctor Timetable"
      description="View and manage doctor schedules"
    >
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="mb-4 sm:mb-0 flex items-center">
          <Button variant="outline" size="sm" className="mr-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button variant="default" size="sm" className="mr-2">
            Today
          </Button>
          <Button variant="outline" size="sm">
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        {(user?.role === "doctor" || user?.role === "nurse") && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="flex items-center"
                onClick={() => setSelectedSchedule(undefined)}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{selectedSchedule ? "Edit Schedule" : "Create New Schedule"}</DialogTitle>
                <DialogDescription>
                  {selectedSchedule 
                    ? "Modify the existing schedule entry" 
                    : "Add a new entry to the doctor's schedule"}
                </DialogDescription>
              </DialogHeader>
              <ScheduleForm 
                onClose={() => setIsDialogOpen(false)}
                existingSchedule={selectedSchedule}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="doctor-select" className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
              <Select 
                onValueChange={setSelectedDoctor}
                defaultValue={selectedDoctor}
              >
                <SelectTrigger id="doctor-select">
                  <SelectValue placeholder="All Doctors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Doctors</SelectItem>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id.toString()}>
                      Dr. {doctor.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="week-select" className="block text-sm font-medium text-gray-700 mb-1">Week</label>
              <Select defaultValue="current">
                <SelectTrigger id="week-select">
                  <SelectValue placeholder="Select week" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Week</SelectItem>
                  <SelectItem value="next">Next Week</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="view-mode" className="block text-sm font-medium text-gray-700 mb-1">View</label>
              <Select 
                onValueChange={setViewMode}
                defaultValue={viewMode}
              >
                <SelectTrigger id="view-mode">
                  <SelectValue placeholder="Weekly View" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly View</SelectItem>
                  <SelectItem value="daily">Daily View</SelectItem>
                  <SelectItem value="list">List View</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarDays className="mr-2 h-5 w-5" />
            Weekly Schedule: {weekDates[0].toLocaleDateString()} - {weekDates[weekDates.length - 1].toLocaleDateString()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSchedules ? (
            <div className="py-8 text-center text-gray-500">Loading schedule information...</div>
          ) : (
            <>
              {viewMode === "weekly" && (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="py-3 px-4 border bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        {weekdays.slice(0, 5).map((day, index) => (
                          <th key={day} className="py-3 px-4 border bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {day.charAt(0).toUpperCase() + day.slice(1)}<br />
                            {weekDates[index].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {timeSlots.map((timeSlot) => (
                        <tr key={timeSlot}>
                          <td className="py-2 px-4 border bg-gray-50 font-medium text-sm text-gray-700">
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {timeSlot}
                            </div>
                          </td>
                          {weekdays.slice(0, 5).map((day) => (
                            <td key={`${day}-${timeSlot}`} className="py-2 px-2 border min-h-[80px]">
                              {getSchedulesForTimeSlot(timeSlot, day).map((schedule) => (
                                <div key={schedule.id} className="mb-1 relative group">
                                  <ScheduleEntry 
                                    schedule={schedule} 
                                    doctorName={getDoctorName(schedule.doctorId)}
                                    color={getColorClass(schedule.activityType)}
                                  />
                                  
                                  {/* Show edit/delete buttons for doctor's own schedule or nurse */}
                                  {(user?.role === "nurse" || (user?.role === "doctor" && user.id === schedule.doctorId)) && (
                                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-5 w-5 rounded-full bg-white"
                                        onClick={() => handleEditSchedule(schedule)}
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-5 w-5 rounded-full bg-white text-red-500"
                                        onClick={() => handleDeleteSchedule(schedule.id)}
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {viewMode === "list" && (
                <div className="space-y-6">
                  {Object.entries(schedulesByDay).map(([day, daySchedules]) => (
                    <div key={day} className="mb-4">
                      {daySchedules.length > 0 && (
                        <>
                          <h3 className="text-lg font-medium capitalize mb-2">{day}</h3>
                          <div className="space-y-2">
                            {daySchedules.map((schedule) => (
                              <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-md">
                                <div>
                                  <div className="font-medium">{getDoctorName(schedule.doctorId) || `Dr. ID ${schedule.doctorId}`}</div>
                                  <div className="text-sm text-gray-500">{schedule.activityType}</div>
                                  <div className="text-sm text-gray-500">{schedule.startTime} - {schedule.endTime}</div>
                                </div>
                                
                                {(user?.role === "nurse" || (user?.role === "doctor" && user.id === schedule.doctorId)) && (
                                  <div className="flex space-x-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => handleEditSchedule(schedule)}
                                    >
                                      Edit
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="text-red-500"
                                      onClick={() => handleDeleteSchedule(schedule.id)}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  
                  {Object.values(schedulesByDay).every(schedules => schedules.length === 0) && (
                    <div className="py-8 text-center text-gray-500">
                      No schedules found for the selected criteria
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
