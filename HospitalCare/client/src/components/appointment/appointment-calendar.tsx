import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Appointment } from "@shared/schema";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppointmentCalendarProps {
  onDateSelect: (date: string) => void;
  selectedDate: string;
}

export default function AppointmentCalendar({ onDateSelect, selectedDate }: AppointmentCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Fetch appointments for the month
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  
  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });
  
  // Filter appointments for current month view
  const monthAppointments = appointments.filter(appointment => {
    const appDate = new Date(appointment.appointmentDate);
    return appDate >= startOfMonth && appDate <= endOfMonth;
  });
  
  // Generate calendar days for the month
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Get first day of month and adjust for start of week (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Previous month's days to fill start of calendar
    const startPadding = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Adjust for Monday start
    
    // Previous month
    const prevMonthDays = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = prevMonthLastDay - startPadding + 1; i <= prevMonthLastDay; i++) {
      prevMonthDays.push({
        date: new Date(year, month - 1, i),
        isCurrentMonth: false,
        appointments: []
      });
    }
    
    // Current month
    const currentMonthDays = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Get appointments for this day
      const dayAppointments = monthAppointments.filter(appointment => {
        return new Date(appointment.appointmentDate).toISOString().split('T')[0] === dateStr;
      });
      
      currentMonthDays.push({
        date,
        isCurrentMonth: true,
        isToday: dateStr === new Date().toISOString().split('T')[0],
        isSelected: dateStr === selectedDate,
        appointments: dayAppointments
      });
    }
    
    // Next month days to fill end of calendar
    const totalDaysShown = 42; // 6 weeks
    const endPadding = totalDaysShown - (prevMonthDays.length + currentMonthDays.length);
    
    const nextMonthDays = [];
    for (let i = 1; i <= endPadding; i++) {
      nextMonthDays.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        appointments: []
      });
    }
    
    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  };
  
  const calendarDays = generateCalendarDays();
  
  // Navigation functions
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  const goToToday = () => {
    setCurrentMonth(new Date());
    onDateSelect(new Date().toISOString().split('T')[0]);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Appointment Calendar</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button variant="default" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      <div className="p-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
        </div>

        <div className="grid grid-cols-7 gap-4 mb-2">
          <div className="text-center text-sm font-medium text-gray-600">Mon</div>
          <div className="text-center text-sm font-medium text-gray-600">Tue</div>
          <div className="text-center text-sm font-medium text-gray-600">Wed</div>
          <div className="text-center text-sm font-medium text-gray-600">Thu</div>
          <div className="text-center text-sm font-medium text-gray-600">Fri</div>
          <div className="text-center text-sm font-medium text-gray-600">Sat</div>
          <div className="text-center text-sm font-medium text-gray-600">Sun</div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <div 
              key={index} 
              className={`min-h-[100px] p-2 border ${
                day.isCurrentMonth ? 
                  day.isSelected ? 'border-primary-dark bg-primary-light/10' :
                  day.isToday ? 'border-primary' : 'border-gray-200' : 
                  'border-gray-200 bg-gray-50'
              } ${day.isCurrentMonth ? 'cursor-pointer hover:bg-gray-50' : 'text-gray-400'}`}
              onClick={() => day.isCurrentMonth && onDateSelect(day.date.toISOString().split('T')[0])}
            >
              <div className={`text-sm ${
                day.isCurrentMonth ?
                  day.isSelected ? 'font-bold text-primary' :
                  day.isToday ? 'font-bold' : '' : 
                  'text-gray-400'
              }`}>
                {day.date.getDate()}
              </div>
              
              {day.appointments.slice(0, 3).map((appointment, appIndex) => (
                <div 
                  key={appIndex} 
                  className={`mt-1 text-xs p-1 rounded truncate ${
                    appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                    appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                    appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}
                  title={`${new Date(appointment.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${appointment.type}`}
                >
                  {new Date(appointment.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              ))}
              
              {day.appointments.length > 3 && (
                <div className="mt-1 text-xs text-gray-500 text-center">
                  +{day.appointments.length - 3} more
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
