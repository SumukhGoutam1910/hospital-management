import { users, User, InsertUser, appointments, Appointment, InsertAppointment, beds, Bed, InsertBed, prescriptions, Prescription, InsertPrescription, doctorSchedules, DoctorSchedule, InsertDoctorSchedule } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsersByRole(role: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;

  // Appointment methods
  getAppointment(id: number): Promise<Appointment | undefined>;
  getAppointmentsByPatient(patientId: number): Promise<Appointment[]>;
  getAppointmentsByDoctor(doctorId: number): Promise<Appointment[]>;
  getAppointmentsByDate(date: Date): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<Appointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: number): Promise<boolean>;

  // Bed methods
  getBed(id: number): Promise<Bed | undefined>;
  getBedByNumber(bedNumber: string): Promise<Bed | undefined>;
  getBedsByWard(ward: string): Promise<Bed[]>;
  getBedsByStatus(status: string): Promise<Bed[]>;
  getAllBeds(): Promise<Bed[]>;
  createBed(bed: InsertBed): Promise<Bed>;
  updateBed(id: number, bed: Partial<Bed>): Promise<Bed | undefined>;

  // Prescription methods
  getPrescription(id: number): Promise<Prescription | undefined>;
  getPrescriptionsByPatient(patientId: number): Promise<Prescription[]>;
  getPrescriptionsByDoctor(doctorId: number): Promise<Prescription[]>;
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  updatePrescription(id: number, prescription: Partial<Prescription>): Promise<Prescription | undefined>;

  // Doctor Schedule methods
  getDoctorSchedule(id: number): Promise<DoctorSchedule | undefined>;
  getDoctorSchedulesByDoctor(doctorId: number): Promise<DoctorSchedule[]>;
  createDoctorSchedule(schedule: InsertDoctorSchedule): Promise<DoctorSchedule>;
  updateDoctorSchedule(id: number, schedule: Partial<DoctorSchedule>): Promise<DoctorSchedule | undefined>;
  deleteDoctorSchedule(id: number): Promise<boolean>;

  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private appointments: Map<number, Appointment>;
  private beds: Map<number, Bed>;
  private prescriptions: Map<number, Prescription>;
  private doctorSchedules: Map<number, DoctorSchedule>;
  
  private userIdCounter: number;
  private appointmentIdCounter: number;
  private bedIdCounter: number;
  private prescriptionIdCounter: number;
  private scheduleIdCounter: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.appointments = new Map();
    this.beds = new Map();
    this.prescriptions = new Map();
    this.doctorSchedules = new Map();
    
    this.userIdCounter = 1;
    this.appointmentIdCounter = 1;
    this.bedIdCounter = 1;
    this.prescriptionIdCounter = 1;
    this.scheduleIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    
    // Initialize some data
    this.initializeData();
  }

  private initializeData() {
    // Create some initial beds
    const wards = ["general", "icu", "pediatric", "maternity"];
    
    // Generate 20 beds across different wards
    for (let i = 1; i <= 20; i++) {
      const ward = wards[i % wards.length];
      const wardPrefix = ward.charAt(0).toUpperCase();
      this.createBed({
        bedNumber: `${wardPrefix}${i.toString().padStart(2, '0')}`,
        ward,
        status: "available",
        patientId: null,
      });
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.role === role,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Appointment methods
  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async getAppointmentsByPatient(patientId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      (appointment) => appointment.patientId === patientId,
    );
  }

  async getAppointmentsByDoctor(doctorId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      (appointment) => appointment.doctorId === doctorId,
    );
  }

  async getAppointmentsByDate(date: Date): Promise<Appointment[]> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    return Array.from(this.appointments.values()).filter(appointment => {
      const appDate = new Date(appointment.appointmentDate);
      return appDate >= targetDate && appDate < nextDay;
    });
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = this.appointmentIdCounter++;
    const appointment: Appointment = { 
      ...insertAppointment, 
      id,
      appointmentDate: new Date(insertAppointment.appointmentDate)
    };
    this.appointments.set(id, appointment);
    return appointment;
  }

  async updateAppointment(id: number, appointmentUpdate: Partial<Appointment>): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;
    
    const updatedAppointment = { ...appointment, ...appointmentUpdate };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    return this.appointments.delete(id);
  }

  // Bed methods
  async getBed(id: number): Promise<Bed | undefined> {
    return this.beds.get(id);
  }

  async getBedByNumber(bedNumber: string): Promise<Bed | undefined> {
    return Array.from(this.beds.values()).find(
      (bed) => bed.bedNumber === bedNumber,
    );
  }

  async getBedsByWard(ward: string): Promise<Bed[]> {
    return Array.from(this.beds.values()).filter(
      (bed) => bed.ward === ward,
    );
  }

  async getBedsByStatus(status: string): Promise<Bed[]> {
    return Array.from(this.beds.values()).filter(
      (bed) => bed.status === status,
    );
  }

  async getAllBeds(): Promise<Bed[]> {
    return Array.from(this.beds.values());
  }

  async createBed(insertBed: InsertBed): Promise<Bed> {
    const id = this.bedIdCounter++;
    const bed: Bed = { ...insertBed, id };
    this.beds.set(id, bed);
    return bed;
  }

  async updateBed(id: number, bedUpdate: Partial<Bed>): Promise<Bed | undefined> {
    const bed = this.beds.get(id);
    if (!bed) return undefined;
    
    const updatedBed = { ...bed, ...bedUpdate };
    this.beds.set(id, updatedBed);
    return updatedBed;
  }

  // Prescription methods
  async getPrescription(id: number): Promise<Prescription | undefined> {
    return this.prescriptions.get(id);
  }

  async getPrescriptionsByPatient(patientId: number): Promise<Prescription[]> {
    return Array.from(this.prescriptions.values()).filter(
      (prescription) => prescription.patientId === patientId,
    );
  }

  async getPrescriptionsByDoctor(doctorId: number): Promise<Prescription[]> {
    return Array.from(this.prescriptions.values()).filter(
      (prescription) => prescription.doctorId === doctorId,
    );
  }

  async createPrescription(insertPrescription: InsertPrescription): Promise<Prescription> {
    const id = this.prescriptionIdCounter++;
    const prescription: Prescription = { 
      ...insertPrescription, 
      id,
      prescriptionDate: new Date(insertPrescription.prescriptionDate)
    };
    this.prescriptions.set(id, prescription);
    return prescription;
  }

  async updatePrescription(id: number, prescriptionUpdate: Partial<Prescription>): Promise<Prescription | undefined> {
    const prescription = this.prescriptions.get(id);
    if (!prescription) return undefined;
    
    const updatedPrescription = { ...prescription, ...prescriptionUpdate };
    this.prescriptions.set(id, updatedPrescription);
    return updatedPrescription;
  }

  // Doctor Schedule methods
  async getDoctorSchedule(id: number): Promise<DoctorSchedule | undefined> {
    return this.doctorSchedules.get(id);
  }

  async getDoctorSchedulesByDoctor(doctorId: number): Promise<DoctorSchedule[]> {
    return Array.from(this.doctorSchedules.values()).filter(
      (schedule) => schedule.doctorId === doctorId,
    );
  }

  async createDoctorSchedule(insertSchedule: InsertDoctorSchedule): Promise<DoctorSchedule> {
    const id = this.scheduleIdCounter++;
    const schedule: DoctorSchedule = { ...insertSchedule, id };
    this.doctorSchedules.set(id, schedule);
    return schedule;
  }

  async updateDoctorSchedule(id: number, scheduleUpdate: Partial<DoctorSchedule>): Promise<DoctorSchedule | undefined> {
    const schedule = this.doctorSchedules.get(id);
    if (!schedule) return undefined;
    
    const updatedSchedule = { ...schedule, ...scheduleUpdate };
    this.doctorSchedules.set(id, updatedSchedule);
    return updatedSchedule;
  }
  
  async deleteDoctorSchedule(id: number): Promise<boolean> {
    return this.doctorSchedules.delete(id);
  }
}

export const storage = new MemStorage();
