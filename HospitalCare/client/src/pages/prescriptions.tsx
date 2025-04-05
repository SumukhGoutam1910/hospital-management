import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Prescription, User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Download, FileText, PlusCircle, Search, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PrescriptionForm from "@/components/prescription/prescription-form";
import PrescriptionView from "@/components/prescription/prescription-view";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Prescriptions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [patientFilter, setPatientFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("30");  // Last 30 days by default
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Fetch prescriptions
  const { data: prescriptions = [], isLoading: isLoadingPrescriptions } = useQuery<Prescription[]>({
    queryKey: ["/api/prescriptions"],
  });
  
  // Fetch patients for filter (only for doctor/nurse)
  const { data: patients = [] } = useQuery<User[]>({
    queryKey: ["/api/users/patients"],
    enabled: user?.role !== "patient",
  });
  
  // Download prescription
  const downloadPrescription = (prescription: Prescription) => {
    if (!prescription.fileData) {
      toast({
        title: "Error",
        description: "No prescription file available for download",
        variant: "destructive",
      });
      return;
    }
    
    // Convert base64 to Blob
    const byteCharacters = atob(prescription.fileData);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = prescription.fileName || `prescription-${prescription.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Handle viewing a prescription
  const handleViewPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setViewDialogOpen(true);
  };
  
  // Filter prescriptions based on selections
  const filteredPrescriptions = prescriptions.filter(prescription => {
    // Filter by patient
    const matchesPatient = patientFilter === "all" || 
      prescription.patientId.toString() === patientFilter;
    
    // Filter by date
    let matchesDate = true;
    if (dateFilter !== "all") {
      const daysAgo = parseInt(dateFilter);
      const prescriptionDate = new Date(prescription.prescriptionDate);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
      matchesDate = prescriptionDate >= cutoffDate;
    }
    
    // Filter by search query
    const matchesSearch = !searchQuery || 
      prescription.id.toString().includes(searchQuery);
    
    return matchesPatient && matchesDate && matchesSearch;
  });
  
  return (
    <DashboardLayout
      title="Prescription Management"
      description="Create, upload and manage patient prescriptions"
    >
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="mb-4 sm:mb-0">
          <h2 className="text-lg font-medium">Recent Prescriptions</h2>
        </div>
        {user?.role === "doctor" && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Prescription
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Create New Prescription</DialogTitle>
                <DialogDescription>
                  Create a prescription and upload a PDF file if needed
                </DialogDescription>
              </DialogHeader>
              <PrescriptionForm onClose={() => setCreateDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {user?.role !== "patient" && (
              <div>
                <label htmlFor="patient-filter" className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                <Select 
                  onValueChange={setPatientFilter}
                  defaultValue={patientFilter}
                >
                  <SelectTrigger id="patient-filter">
                    <SelectValue placeholder="All Patients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Patients</SelectItem>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id.toString()}>
                        {patient.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <label htmlFor="date-range" className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <Select
                onValueChange={setDateFilter}
                defaultValue={dateFilter}
              >
                <SelectTrigger id="date-range">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="prescription-search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-500" />
                </div>
                <Input
                  id="prescription-search"
                  className="pl-10"
                  placeholder="Search by ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          {isLoadingPrescriptions ? (
            <div className="py-8 text-center text-gray-500">Loading prescriptions...</div>
          ) : filteredPrescriptions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {user?.role === "patient" ? "Doctor" : "Patient"}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPrescriptions.map((prescription) => (
                    <tr key={prescription.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">PRX-{prescription.id.toString().padStart(4, '0')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user?.role === "patient" ? 
                            `Dr. ID ${prescription.doctorId}` : 
                            `Patient ID ${prescription.patientId}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(prescription.prescriptionDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={prescription.status === "active" ? "default" : "secondary"}>
                          {prescription.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewPrescription(prescription)}
                          className="text-primary hover:text-primary-dark mr-2"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        
                        {prescription.fileData && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => downloadPrescription(prescription)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              No prescriptions found
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Prescription Details</DialogTitle>
            <DialogDescription>
              View prescription information and download if available
            </DialogDescription>
          </DialogHeader>
          {selectedPrescription && (
            <PrescriptionView 
              prescription={selectedPrescription} 
              onDownload={downloadPrescription}
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
