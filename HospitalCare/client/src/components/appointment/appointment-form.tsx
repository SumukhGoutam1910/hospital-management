import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { User } from "@shared/schema";

interface AppointmentFormProps {
  onClose: () => void;
  defaultDate?: string;
  defaultTime?: string;
  appointmentId?: number;
}

export default function AppointmentForm({ onClose, defaultDate, defaultTime, appointmentId }: AppointmentFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Create appointment schema
  const appointmentSchema = z.object({
    patientId: z.number(),
    doctorId: z.number(),
    appointmentDate: z.string().min(1, "Date and time is required"),
    duration: z.coerce.number().min(15, "Duration must be at least 15 minutes"),
    status: z.string(),
    type: z.string(),
    notes: z.string().optional(),
  });
  
  type AppointmentFormValues = z.infer<typeof appointmentSchema>;
  
  // Fetch doctors for patient to select
  const { data: doctors = [] } = useQuery<User[]>({
    queryKey: ["/api/users/doctors"],
    enabled: user?.role === "patient",
  });
  
  // Fetch patients for doctor/nurse to select
  const { data: patients = [] } = useQuery<User[]>({
    queryKey: ["/api/users/patients"],
    enabled: user?.role !== "patient",
  });
  
  // Fetch appointment if editing
  const { data: appointment, isLoading: isLoadingAppointment } = useQuery({
    queryKey: ["/api/appointments", appointmentId],
    queryFn: async () => {
      if (!appointmentId) return null;
      const response = await fetch(`/api/appointments/${appointmentId}`);
      if (!response.ok) throw new Error("Failed to fetch appointment");
      return response.json();
    },
    enabled: !!appointmentId,
  });
  
  // Format defaultDateTime for the form
  const getDefaultDateTime = () => {
    if (appointment) {
      return new Date(appointment.appointmentDate).toISOString().slice(0, 16);
    }
    
    if (defaultDate) {
      const date = new Date(defaultDate);
      if (defaultTime) {
        const [hours, minutes] = defaultTime.split(':');
        date.setHours(parseInt(hours), parseInt(minutes));
      }
      return date.toISOString().slice(0, 16);
    }
    
    // Default to now + 1 hour, rounded to nearest 15 minutes
    const date = new Date();
    date.setHours(date.getHours() + 1);
    date.setMinutes(Math.ceil(date.getMinutes() / 15) * 15);
    return date.toISOString().slice(0, 16);
  };
  
  // Default form values
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: appointment ? {
      ...appointment,
      appointmentDate: new Date(appointment.appointmentDate).toISOString().slice(0, 16)
    } : {
      patientId: user?.role === "patient" ? user.id : undefined,
      doctorId: user?.role === "doctor" ? user.id : undefined,
      appointmentDate: getDefaultDateTime(),
      duration: 30,
      status: "scheduled",
      type: "consultation",
      notes: "",
    },
  });
  
  // Create/update appointment mutation
  const appointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormValues) => {
      if (appointmentId) {
        // Update
        const response = await apiRequest("PUT", `/api/appointments/${appointmentId}`, data);
        return response.json();
      } else {
        // Create
        const response = await apiRequest("POST", "/api/appointments", data);
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: appointmentId ? "Appointment Updated" : "Appointment Created",
        description: appointmentId 
          ? "The appointment has been updated successfully" 
          : "Your appointment has been successfully scheduled",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${appointmentId ? "update" : "create"} appointment: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: AppointmentFormValues) => {
    appointmentMutation.mutate(data);
  };
  
  if (isLoadingAppointment && appointmentId) {
    return <div className="py-8 text-center">Loading appointment details...</div>;
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {user?.role !== "patient" && (
          <FormField
            control={form.control}
            name="patientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Patient</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id.toString()}>
                        {patient.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        {user?.role === "patient" && (
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
                        Dr. {doctor.fullName} {doctor.specialization ? `(${doctor.specialization})` : ''}
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
          name="appointmentDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date and Time</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (minutes)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="15" 
                  step="15" 
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Appointment Type</FormLabel>
              <Select 
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="follow-up">Follow-Up</SelectItem>
                  <SelectItem value="check-up">Check-Up</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {appointmentId && (
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select 
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add any additional information"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={appointmentMutation.isPending}>
            {appointmentMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {appointmentId ? "Updating..." : "Creating..."}
              </>
            ) : (
              appointmentId ? "Update Appointment" : "Create Appointment"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
