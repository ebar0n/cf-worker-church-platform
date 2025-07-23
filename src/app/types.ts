export interface MediaFile {
  type: 'image' | 'video';
  src: string;
}

// Program/Event information
export interface Program {
  id: number;
  title: string;
  department: string;
  content?: string; // Optional: details, directors, organizers, etc.
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  enrollments?: Enrollment[];
}

// Enrollment system
export interface Enrollment {
  id: number;
  programId: number;
  childId?: number;
  memberId?: number;
  createdAt: Date;
  updatedAt: Date;
  program?: Program;
  child?: any; // Using any since Child interface is not used
  member?: any; // Using any since Member interface is not used
}
