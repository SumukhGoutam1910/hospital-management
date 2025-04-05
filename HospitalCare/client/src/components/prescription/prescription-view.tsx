import { useState, useEffect } from "react";
import { Prescription, User } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PrescriptionViewProps {
  prescription: Prescription;
  onDownload: (prescription: Prescription) => void;
}

export default function PrescriptionView({ prescription, onDownload }: PrescriptionViewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  
  // Fetch doctor and patient info
  const { data: doctor } = useQuery<User>({
    queryKey: ["/api/users/doctors", prescription.doctorId],
    queryFn: async () => {
      const response = await fetch(`/api/users/doctors/${prescription.doctorId}`);
      if (!response.ok) throw new Error("Failed to fetch doctor");
      return response.json();
    },
    enabled: !!prescription.doctorId,
  });
  
  const { data: patient } = useQuery<User>({
    queryKey: ["/api/users/patients", prescription.patientId],
    queryFn: async () => {
      const response = await fetch(`/api/users/patients/${prescription.patientId}`);
      if (!response.ok) throw new Error("Failed to fetch patient");
      return response.json();
    },
    enabled: !!prescription.patientId,
  });
  
  // Create PDF URL from base64 data if available
  useEffect(() => {
    if (prescription.fileData) {
      const byteCharacters = atob(prescription.fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [prescription.fileData]);
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-medium mb-4">Prescription Details</h3>
          <div className="space-y-3">
            <div>
              <span className="block text-sm font-medium text-gray-500">Prescription ID</span>
              <span className="block mt-1">PRX-{prescription.id.toString().padStart(4, '0')}</span>
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-500">Date</span>
              <span className="block mt-1">{new Date(prescription.prescriptionDate).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-500">Status</span>
              <Badge variant={prescription.status === "active" ? "default" : "secondary"} className="mt-1">
                {prescription.status}
              </Badge>
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-500">Doctor</span>
              <span className="block mt-1">
                {doctor ? `Dr. ${doctor.fullName}` : `Doctor ID: ${prescription.doctorId}`}
              </span>
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-500">Patient</span>
              <span className="block mt-1">
                {patient ? patient.fullName : `Patient ID: ${prescription.patientId}`}
              </span>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-4">Notes</h3>
          <div className="bg-gray-50 p-4 rounded-md min-h-[150px]">
            {prescription.notes ? (
              <p className="whitespace-pre-wrap">{prescription.notes}</p>
            ) : (
              <p className="text-gray-500 italic">No notes available</p>
            )}
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-4">Prescription Document</h3>
        {pdfUrl ? (
          <div className="space-y-4">
            <div className="bg-gray-100 rounded-md overflow-hidden">
              <div className="h-96 flex items-center justify-center">
                <iframe 
                  src={pdfUrl} 
                  className="w-full h-full"
                  title="Prescription PDF"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                className="flex items-center"
                onClick={() => onDownload(prescription)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-100 rounded-md p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No prescription document attached</p>
          </div>
        )}
      </div>
    </div>
  );
}
