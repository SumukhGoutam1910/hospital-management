// shared/types/user.ts

export type SelectUser = {
    id: number;
    username: string;
    password: string;
    email: string;
    fullName: string;
    role: string; // e.g., "patient", "doctor", "nurse"
    specialization?: string;
    contactNumber?: string;
    address?: string;
  };
  
  export type InsertUser = Omit<SelectUser, "id">;
  