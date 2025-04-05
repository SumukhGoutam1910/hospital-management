import { ChevronsUpDown, Hotel, Check, X, Clock } from "lucide-react";

interface BedStatusProps {
  totalBeds: number;
  availableBeds: number;
  occupiedBeds: number;
  reservedBeds: number;
  maintenanceBeds?: number;
}

export default function BedStatus({ 
  totalBeds, 
  availableBeds, 
  occupiedBeds, 
  reservedBeds, 
  maintenanceBeds = 0 
}: BedStatusProps) {
  // Calculate percentages for display
  const availablePercentage = Math.round((availableBeds / totalBeds) * 100) || 0;
  const occupiedPercentage = Math.round((occupiedBeds / totalBeds) * 100) || 0;
  const reservedPercentage = Math.round((reservedBeds / totalBeds) * 100) || 0;
  const maintenancePercentage = Math.round((maintenanceBeds / totalBeds) * 100) || 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Total Beds</p>
            <p className="text-2xl font-bold text-gray-800">{totalBeds}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary-light text-primary flex items-center justify-center">
            <Hotel className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-primary h-2.5 rounded-full" style={{ width: `${availablePercentage}%` }}></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {availablePercentage}% available
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Available</p>
            <p className="text-2xl font-bold text-green-600">{availableBeds}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
            <Check className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
          <ChevronsUpDown className="text-gray-400 h-4 w-4 mr-1" />
          <span className="text-gray-600">{availablePercentage}% of total capacity</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Occupied</p>
            <p className="text-2xl font-bold text-red-600">{occupiedBeds}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
            <X className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
          <ChevronsUpDown className="text-gray-400 h-4 w-4 mr-1" />
          <span className="text-gray-600">{occupiedPercentage}% of total capacity</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Reserved</p>
            <p className="text-2xl font-bold text-yellow-600">{reservedBeds}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">
            <Clock className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
          <ChevronsUpDown className="text-gray-400 h-4 w-4 mr-1" />
          <span className="text-gray-600">{reservedPercentage}% of total capacity</span>
        </div>
      </div>
    </div>
  );
}
