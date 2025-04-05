import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import { User } from "@shared/schema";

interface PrescriptionFormProps {
  onClose: () => void;
  prescriptionId?: number;
}

export default function PrescriptionForm({ onClose, prescriptionId }: PrescriptionFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  
  // Schema for prescription form
  const prescriptionSchema = z.object({
    patientId: z.number(),
    doctorId: z.number(),
    prescriptionDate: z.string().min(1, "Date is required"),
    status: z.string(),
    notes: z.string().optional(),
  });
  
  type PrescriptionFormValues = z.infer<typeof prescriptionSchema>;
  
  // Fetch patients if doctor
  const { data: patients = [] } = useQuery<User[]>({
    queryKey: ["/api/users/patients"],
    enabled: user?.role === "doctor",
  });
  
  // Fetch prescription if editing
  const { data: prescription, isLoading: isLoadingPrescription } = useQuery({
    queryKey: ["/api/prescriptions", prescriptionId],
    queryFn: async () => {
      if (!prescriptionId) return null;
      const response = await fetch(`/api/prescriptions/${prescriptionId}`);
      if (!response.ok) throw new Error("Failed to fetch prescription");
      return response.json();
    },
    enabled: !!prescriptionId,
  });
  
  // Form setup
  const form = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: prescription ? {
      ...prescription,
      prescriptionDate: new Date(prescription.prescriptionDate).toISOString().split('T')[0]
    } : {
      patientId: undefined,
      doctorId: user?.id || 0,
      prescriptionDate: new Date().toISOString().split('T')[0],
      status: "active",
      notes: "",
    },
  });
  
  // File handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB
        toast({
          title: "File Too Large",
          description: "File size must be less than 10MB",
          variant: "destructive",
        });
        return;
      }
      
      setPdfFile(file);
    }
  };
  
  // Create/update prescription mutation
  const prescriptionMutation = useMutation({
    mutationFn: async (data: PrescriptionFormValues) => {
      let fileData = null;
      let fileName = null;
      
      // Convert file to base64 if provided
      if (pdfFile) {
        fileData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(pdfFile);
          reader.onload = () => {
            // Extract the base64 data part
            const base64 = reader.result as string;
            const base64Data = base64.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
        });
        fileName = pdfFile.name;
      }
      
      const prescriptionData = {
        ...data,
        fileData,
        fileName,
      };
      
      if (prescriptionId) {
        // Update
        const response = await apiRequest("PUT", `/api/prescriptions/${prescriptionId}`, prescriptionData);
        return response.json();
      } else {
        // Create
        const response = await apiRequest("POST", "/api/prescriptions", prescriptionData);
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: prescriptionId ? "Prescription Updated" : "Prescription Created",
        description: prescriptionId 
          ? "The prescription has been updated successfully" 
          : "New prescription has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${prescriptionId ? "update" : "create"} prescription: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: PrescriptionFormValues) => {
    prescriptionMutation.mutate(data);
  };
  
  if (isLoadingPrescription && prescriptionId) {
    return <div className="py-8 text-center">Loading prescription details...</div>;
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
        
        <FormField
          control={form.control}
          name="prescriptionDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add prescription details or notes"
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Prescription PDF</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              {pdfFile ? (
                <div className="text-sm text-gray-600">
                  <p className="font-medium">{pdfFile.name}</p>
                  <p className="text-xs">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button 
                    type="button" 
                    className="mt-2 text-red-500 hover:text-red-700 text-xs font-medium"
                    onClick={() => setPdfFile(null)}
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark">
                      <span>Upload a file</span>
                      <input 
                        id="file-upload" 
                        name="file-upload" 
                        type="file" 
                        className="sr-only"
                        accept="application/pdf"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF up to 10MB</p>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={prescriptionMutation.isPending}>
            {prescriptionMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {prescriptionId ? "Updating..." : "Creating..."}
              </>
            ) : (
              prescriptionId ? "Update Prescription" : "Create Prescription"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
