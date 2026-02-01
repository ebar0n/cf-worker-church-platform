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

// Course information (open courses)
export interface Course {
  id: number;
  title: string;
  slug: string;
  description: string; // Brief description
  content: string; // Markdown with full details
  imageUrl?: string | null; // Image for social media
  color: string; // Custom color
  cost: number; // Course cost (0 = free)
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  capacity?: number | null; // Max capacity
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  enrollments?: CourseEnrollment[];
}

// Course enrollment status
export type CourseEnrollmentStatus = 'pending' | 'confirmed' | 'rejected';

// Course enrollment
export interface CourseEnrollment {
  id: number;
  courseId: number;
  documentNumber: string;
  fullName: string;
  phone: string;
  birthDate: Date | string;
  isMember: boolean;
  paymentProofUrl?: string | null;
  status: CourseEnrollmentStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  course?: Course;
}
