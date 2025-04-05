import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - for all user types
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull(), // "patient", "doctor", "nurse"
  specialization: text("specialization"), // For doctors
  contactNumber: text("contact_number"),
  address: text("address"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  role: true,
  specialization: true,
  contactNumber: true,
  address: true,
});

// Appointments table
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  appointmentDate: timestamp("appointment_date").notNull(),
  duration: integer("duration").notNull(), // in minutes
  status: text("status").notNull(), // "scheduled", "completed", "cancelled"
  type: text("type").notNull(), // "consultation", "follow-up", "check-up"
  notes: text("notes"),
});

export const insertAppointmentSchema = createInsertSchema(appointments).pick({
  patientId: true,
  doctorId: true,
  appointmentDate: true,
  duration: true,
  status: true,
  type: true,
  notes: true,
});

// Beds table
export const beds = pgTable("beds", {
  id: serial("id").primaryKey(),
  bedNumber: text("bed_number").notNull().unique(),
  ward: text("ward").notNull(), // "general", "icu", "pediatric", "maternity"
  status: text("status").notNull(), // "available", "occupied", "reserved", "maintenance"
  patientId: integer("patient_id"), // null if bed is available
});

export const insertBedSchema = createInsertSchema(beds).pick({
  bedNumber: true,
  ward: true,
  status: true,
  patientId: true,
});

// Prescriptions table
export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  prescriptionDate: timestamp("prescription_date").notNull(),
  status: text("status").notNull(), // "active", "completed"
  notes: text("notes"),
  fileData: text("file_data"), // Base64 encoded PDF data
  fileName: text("file_name"),
});

export const insertPrescriptionSchema = createInsertSchema(prescriptions).pick({
  patientId: true,
  doctorId: true,
  prescriptionDate: true,
  status: true,
  notes: true,
  fileData: true,
  fileName: true,
});

// Doctor schedules
export const doctorSchedules = pgTable("doctor_schedules", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").notNull(),
  day: text("day").notNull(), // "monday", "tuesday", etc.
  startTime: text("start_time").notNull(), // "09:00"
  endTime: text("end_time").notNull(), // "17:00"
  activityType: text("activity_type").notNull(), // "clinic", "surgery", "rounds", "meeting"
});

export const insertDoctorScheduleSchema = createInsertSchema(doctorSchedules).pick({
  doctorId: true,
  day: true,
  startTime: true,
  endTime: true,
  activityType: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type Bed = typeof beds.$inferSelect;
export type InsertBed = z.infer<typeof insertBedSchema>;

export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;

export type DoctorSchedule = typeof doctorSchedules.$inferSelect;
export type InsertDoctorSchedule = z.infer<typeof insertDoctorScheduleSchema>;
