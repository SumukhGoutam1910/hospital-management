import { Bed } from "@shared/schema";

interface BedLayoutProps {
  beds: Bed[];
  onBedClick: (bed: Bed) => void;
}

export default function BedLayout({ beds, onBedClick }: BedLayoutProps) {
  // Get color class based on bed status
  const getBedStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "available":
        return "border-green-500 bg-green-50 text-green-700";
      case "occupied":
        return "border-red-500 bg-red-50 text-red-700";
      case "reserved":
        return "border-yellow-500 bg-yellow-50 text-yellow-700";
      case "maintenance":
        return "border-gray-500 bg-gray-50 text-gray-700";
      default:
        return "border-gray-300 bg-white text-gray-700";
    }
  };
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {beds.map((bed) => (
        <div
          key={bed.id}
          className={`border-2 ${getBedStatusColor(bed.status)} rounded-lg p-3 text-center cursor-pointer hover:shadow-md transition-shadow`}
          onClick={() => onBedClick(bed)}
        >
          <p className="font-semibold">{bed.bedNumber}</p>
          <p className="text-xs capitalize">{bed.status}</p>
          {bed.patientId && bed.status === "occupied" && (
            <p className="text-xs mt-1 truncate">Patient ID: {bed.patientId}</p>
          )}
        </div>
      ))}
      
      {beds.length === 0 && (
        <div className="col-span-full py-8 text-center text-gray-500">
          No beds available in this ward
        </div>
      )}
    </div>
  );
}
