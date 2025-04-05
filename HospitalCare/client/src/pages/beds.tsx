import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Bed, User } from "@shared/schema";
import { Filter, PlusCircle } from "lucide-react";
import BedStatus from "@/components/bed/bed-status";
import BedLayout from "@/components/bed/bed-layout";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Bed assignment form schema
const bedAssignmentSchema = z.object({
  bedId: z.number(),
  patientId: z.number().nullable().optional(),
  status: z.string(),
});

type BedAssignmentFormValues = z.infer<typeof bedAssignmentSchema>;

const BedAssignmentForm = ({ onClose, selectedBed }: { onClose: () => void, selectedBed: Bed | null }) => {
  const { toast } = useToast();
  
  // Fetch patients
  const { data: patients = [] } = useQuery<User[]>({
    queryKey: ["/api/users/patients"],
  });
  
  const form = useForm<BedAssignmentFormValues>({
    resolver: zodResolver(bedAssignmentSchema),
    defaultValues: {
      bedId: selectedBed?.id || 0,
      patientId: selectedBed?.patientId || null,
      status: selectedBed?.status || "available",
    },
  });
  
  const updateBedMutation = useMutation({
    mutationFn: async (data: BedAssignmentFormValues) => {
      const response = await apiRequest("PUT", `/api/beds/${data.bedId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bed Updated",
        description: "Bed status has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/beds"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update bed: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Watch status to conditionally show patient selection
  const status = form.watch("status");
  
  const onSubmit = (data: BedAssignmentFormValues) => {
    if (status !== "occupied" && data.patientId) {
      data.patientId = null;
    }
    updateBedMutation.mutate(data);
  };
  
  if (!selectedBed) return null;
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="font-medium mb-2">
          Bed: {selectedBed.bedNumber} ({selectedBed.ward})
        </div>
        
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
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {status === "occupied" && (
          <FormField
            control={form.control}
            name="patientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assign Patient</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                  defaultValue={field.value?.toString() || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">No Patient</SelectItem>
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
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateBedMutation.isPending}>
            {updateBedMutation.isPending ? "Updating..." : "Update Bed"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default function Beds() {
  const { toast } = useToast();
  const [selectedWard, setSelectedWard] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  
  // Fetch all beds
  const { data: beds = [], isLoading } = useQuery<Bed[]>({
    queryKey: ["/api/beds"],
  });
  
  // Filter beds based on selections
  const filteredBeds = beds.filter(bed => {
    const matchesWard = selectedWard === "all" || bed.ward === selectedWard;
    const matchesStatus = statusFilter === "all" || bed.status === statusFilter;
    const matchesSearch = !searchQuery || 
      bed.bedNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesWard && matchesStatus && matchesSearch;
  });
  
  // Group beds by ward for display
  const bedsByWard = filteredBeds.reduce((acc, bed) => {
    if (!acc[bed.ward]) {
      acc[bed.ward] = [];
    }
    acc[bed.ward].push(bed);
    return acc;
  }, {} as Record<string, Bed[]>);
  
  // Statistics
  const availableBeds = beds.filter(bed => bed.status === "available").length;
  const occupiedBeds = beds.filter(bed => bed.status === "occupied").length;
  const reservedBeds = beds.filter(bed => bed.status === "reserved").length;
  const maintenanceBeds = beds.filter(bed => bed.status === "maintenance").length;
  
  const handleBedClick = (bed: Bed) => {
    setSelectedBed(bed);
    setIsDialogOpen(true);
  };
  
  return (
    <DashboardLayout
      title="Bed Management"
      description="Monitor and manage hospital bed allocations"
    >
      <div className="mb-8">
        <BedStatus 
          totalBeds={beds.length}
          availableBeds={availableBeds}
          occupiedBeds={occupiedBeds}
          reservedBeds={reservedBeds}
          maintenanceBeds={maintenanceBeds}
        />
      </div>
      
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="ward-filter" className="block text-sm font-medium text-gray-700 mb-1">Ward</label>
              <Select 
                onValueChange={setSelectedWard}
                defaultValue={selectedWard}
              >
                <SelectTrigger id="ward-filter">
                  <SelectValue placeholder="All Wards" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Wards</SelectItem>
                  <SelectItem value="general">General Ward</SelectItem>
                  <SelectItem value="icu">ICU</SelectItem>
                  <SelectItem value="pediatric">Pediatric</SelectItem>
                  <SelectItem value="maternity">Maternity</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <Select
                onValueChange={setStatusFilter}
                defaultValue={statusFilter}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="bed-search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-4 w-4 text-gray-500" />
                </div>
                <Input
                  id="bed-search"
                  className="pl-10"
                  placeholder="Search bed number"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isLoading ? (
        <div className="text-center py-8">Loading bed information...</div>
      ) : (
        <>
          {Object.entries(bedsByWard).map(([ward, wardBeds]) => (
            <Card key={ward} className="mb-8">
              <CardHeader>
                <CardTitle className="capitalize">{ward} Ward</CardTitle>
              </CardHeader>
              <CardContent>
                <BedLayout beds={wardBeds} onBedClick={handleBedClick} />
              </CardContent>
            </Card>
          ))}
          
          {Object.keys(bedsByWard).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No beds match the current filters
            </div>
          )}
        </>
      )}
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Manage Bed</DialogTitle>
            <DialogDescription>
              Update bed status or assign to a patient
            </DialogDescription>
          </DialogHeader>
          <BedAssignmentForm 
            onClose={() => setIsDialogOpen(false)}
            selectedBed={selectedBed}
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
