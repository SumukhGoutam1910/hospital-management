import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertAppointmentSchema, insertBedSchema, insertPrescriptionSchema, insertDoctorScheduleSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Middleware to check if user is authenticated
  const ensureAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Middleware to check if user has specific role
  const checkRole = (roles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (req.isAuthenticated() && roles.includes(req.user.role)) {
        return next();
      }
      res.status(403).json({ message: "Forbidden" });
    };
  };

  // Validation error handler
  const handleValidation = (schema: any, data: any) => {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        throw { status: 400, message: validationError.message };
      }
      throw error;
    }
  };

  // User routes
  app.get("/api/users/doctors", ensureAuthenticated, async (req, res) => {
    const doctors = await storage.getUsersByRole("doctor");
    // Remove passwords from response
    const doctorsWithoutPasswords = doctors.map(({ password, ...rest }) => rest);
    res.json(doctorsWithoutPasswords);
  });

  app.get("/api/users/patients", ensureAuthenticated, checkRole(["doctor", "nurse"]), async (req, res) => {
    const patients = await storage.getUsersByRole("patient");
    // Remove passwords from response
    const patientsWithoutPasswords = patients.map(({ password, ...rest }) => rest);
    res.json(patientsWithoutPasswords);
  });

  // Appointment routes
  app.get("/api/appointments", ensureAuthenticated, async (req, res) => {
    let appointments;
    
    if (req.user.role === "patient") {
      appointments = await storage.getAppointmentsByPatient(req.user.id);
    } else if (req.user.role === "doctor") {
      appointments = await storage.getAppointmentsByDoctor(req.user.id);
    } else {
      // Nurses can see all appointments
      const allDoctors = await storage.getUsersByRole("doctor");
      const doctorIds = allDoctors.map(doctor => doctor.id);
      
      appointments = [];
      for (const doctorId of doctorIds) {
        const doctorAppointments = await storage.getAppointmentsByDoctor(doctorId);
        appointments.push(...doctorAppointments);
      }
    }
    
    res.json(appointments);
  });

  app.get("/api/appointments/date/:date", ensureAuthenticated, async (req, res) => {
    const date = new Date(req.params.date);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }
    
    const appointments = await storage.getAppointmentsByDate(date);
    res.json(appointments);
  });

  app.post("/api/appointments", ensureAuthenticated, async (req, res) => {
    try {
      const appointmentData = handleValidation(insertAppointmentSchema, req.body);
      
      // Only patients and staff can create appointments
      if (req.user.role === "patient" && appointmentData.patientId !== req.user.id) {
        return res.status(403).json({ message: "You can only create appointments for yourself" });
      }
      
      const appointment = await storage.createAppointment(appointmentData);
      res.status(201).json(appointment);
    } catch (error: any) {
      if (error.status) {
        res.status(error.status).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put("/api/appointments/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const appointment = await storage.getAppointment(id);
      
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      // Only own appointments can be modified by patients
      if (req.user.role === "patient" && appointment.patientId !== req.user.id) {
        return res.status(403).json({ message: "You can only modify your own appointments" });
      }
      
      const updatedAppointment = await storage.updateAppointment(id, req.body);
      res.json(updatedAppointment);
    } catch (error: any) {
      if (error.status) {
        res.status(error.status).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete("/api/appointments/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const appointment = await storage.getAppointment(id);
      
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      // Only own appointments can be deleted by patients
      if (req.user.role === "patient" && appointment.patientId !== req.user.id) {
        return res.status(403).json({ message: "You can only delete your own appointments" });
      }
      
      const success = await storage.deleteAppointment(id);
      
      if (success) {
        res.status(204).end();
      } else {
        res.status(404).json({ message: "Appointment not found" });
      }
    } catch (error: any) {
      if (error.status) {
        res.status(error.status).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Bed routes
  app.get("/api/beds", ensureAuthenticated, async (req, res) => {
    const beds = await storage.getAllBeds();
    res.json(beds);
  });

  app.get("/api/beds/ward/:ward", ensureAuthenticated, async (req, res) => {
    const ward = req.params.ward;
    const beds = await storage.getBedsByWard(ward);
    res.json(beds);
  });

  app.get("/api/beds/status/:status", ensureAuthenticated, async (req, res) => {
    const status = req.params.status;
    const beds = await storage.getBedsByStatus(status);
    res.json(beds);
  });

  app.post("/api/beds", ensureAuthenticated, checkRole(["doctor", "nurse"]), async (req, res) => {
    try {
      const bedData = handleValidation(insertBedSchema, req.body);
      const bed = await storage.createBed(bedData);
      res.status(201).json(bed);
    } catch (error: any) {
      if (error.status) {
        res.status(error.status).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put("/api/beds/:id", ensureAuthenticated, checkRole(["doctor", "nurse"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const bed = await storage.getBed(id);
      
      if (!bed) {
        return res.status(404).json({ message: "Bed not found" });
      }
      
      const updatedBed = await storage.updateBed(id, req.body);
      res.json(updatedBed);
    } catch (error: any) {
      if (error.status) {
        res.status(error.status).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Prescription routes
  app.get("/api/prescriptions", ensureAuthenticated, async (req, res) => {
    let prescriptions;
    
    if (req.user.role === "patient") {
      prescriptions = await storage.getPrescriptionsByPatient(req.user.id);
    } else if (req.user.role === "doctor") {
      prescriptions = await storage.getPrescriptionsByDoctor(req.user.id);
    } else {
      // Nurses can see all prescriptions
      const allDoctors = await storage.getUsersByRole("doctor");
      const doctorIds = allDoctors.map(doctor => doctor.id);
      
      prescriptions = [];
      for (const doctorId of doctorIds) {
        const doctorPrescriptions = await storage.getPrescriptionsByDoctor(doctorId);
        prescriptions.push(...doctorPrescriptions);
      }
    }
    
    res.json(prescriptions);
  });

  app.get("/api/prescriptions/:id", ensureAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const prescription = await storage.getPrescription(id);
      
      if (!prescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      
      // Patients can only view their own prescriptions
      if (req.user.role === "patient" && prescription.patientId !== req.user.id) {
        return res.status(403).json({ message: "You can only view your own prescriptions" });
      }
      
      res.json(prescription);
    } catch (error: any) {
      if (error.status) {
        res.status(error.status).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.post("/api/prescriptions", ensureAuthenticated, checkRole(["doctor"]), async (req, res) => {
    try {
      const prescriptionData = handleValidation(insertPrescriptionSchema, req.body);
      
      // Doctors can only create prescriptions for themselves
      if (prescriptionData.doctorId !== req.user.id) {
        return res.status(403).json({ message: "You can only create prescriptions as yourself" });
      }
      
      const prescription = await storage.createPrescription(prescriptionData);
      res.status(201).json(prescription);
    } catch (error: any) {
      if (error.status) {
        res.status(error.status).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put("/api/prescriptions/:id", ensureAuthenticated, checkRole(["doctor"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const prescription = await storage.getPrescription(id);
      
      if (!prescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      
      // Doctors can only modify their own prescriptions
      if (prescription.doctorId !== req.user.id) {
        return res.status(403).json({ message: "You can only modify your own prescriptions" });
      }
      
      const updatedPrescription = await storage.updatePrescription(id, req.body);
      res.json(updatedPrescription);
    } catch (error: any) {
      if (error.status) {
        res.status(error.status).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Doctor Schedule routes
  app.get("/api/schedules", ensureAuthenticated, async (req, res) => {
    // If doctor, get their own schedule
    if (req.user.role === "doctor") {
      const schedules = await storage.getDoctorSchedulesByDoctor(req.user.id);
      return res.json(schedules);
    }
    
    // Otherwise get all doctors' schedules
    const doctors = await storage.getUsersByRole("doctor");
    const allSchedules = [];
    
    for (const doctor of doctors) {
      const schedules = await storage.getDoctorSchedulesByDoctor(doctor.id);
      allSchedules.push(...schedules);
    }
    
    res.json(allSchedules);
  });

  app.get("/api/schedules/doctor/:id", ensureAuthenticated, async (req, res) => {
    try {
      const doctorId = parseInt(req.params.id);
      const schedules = await storage.getDoctorSchedulesByDoctor(doctorId);
      res.json(schedules);
    } catch (error: any) {
      if (error.status) {
        res.status(error.status).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.post("/api/schedules", ensureAuthenticated, checkRole(["doctor", "nurse"]), async (req, res) => {
    try {
      const scheduleData = handleValidation(insertDoctorScheduleSchema, req.body);
      
      // Only doctors can create their own schedules, or nurses can create for any doctor
      if (req.user.role === "doctor" && scheduleData.doctorId !== req.user.id) {
        return res.status(403).json({ message: "You can only create schedules for yourself" });
      }
      
      const schedule = await storage.createDoctorSchedule(scheduleData);
      res.status(201).json(schedule);
    } catch (error: any) {
      if (error.status) {
        res.status(error.status).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put("/api/schedules/:id", ensureAuthenticated, checkRole(["doctor", "nurse"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const schedule = await storage.getDoctorSchedule(id);
      
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      
      // Only doctors can update their own schedules, or nurses can update for any doctor
      if (req.user.role === "doctor" && schedule.doctorId !== req.user.id) {
        return res.status(403).json({ message: "You can only update your own schedules" });
      }
      
      const updatedSchedule = await storage.updateDoctorSchedule(id, req.body);
      res.json(updatedSchedule);
    } catch (error: any) {
      if (error.status) {
        res.status(error.status).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete("/api/schedules/:id", ensureAuthenticated, checkRole(["doctor", "nurse"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const schedule = await storage.getDoctorSchedule(id);
      
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      
      // Only doctors can delete their own schedules, or nurses can delete for any doctor
      if (req.user.role === "doctor" && schedule.doctorId !== req.user.id) {
        return res.status(403).json({ message: "You can only delete your own schedules" });
      }
      
      const success = await storage.deleteDoctorSchedule(id);
      
      if (success) {
        res.status(204).end();
      } else {
        res.status(404).json({ message: "Schedule not found" });
      }
    } catch (error: any) {
      if (error.status) {
        res.status(error.status).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  return httpServer;
}
