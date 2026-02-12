export interface Story {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  date: string;
}

export interface Founder {
  id: string;
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
}

export interface NavLink {
  label: string;
  href: string;
  isButton?: boolean;
}

// New interface for Chapter Activities
export interface ChapterActivity {
  id: number | string;
  title: string;
  description: string;
  date?: string;
  imageUrl?: string;
}

export interface Chapter {
  id: string;
  name: string;
  location: string;
  logo: string;
  image?: string; // Cover image for the chapter
  description?: string;
  email?: string;
  phone?: string;
  facebook?: string;
  
  // Newly added fields
  twitter?: string;
  instagram?: string;
  
  // Leadership fields
  headName?: string;
  headRole?: string;
  headQuote?: string;
  headImageUrl?: string;
  
  // Join CTA fields
  joinUrl?: string;
  joinCtaDescription?: string;
  
  // Activities list
  activities?: ChapterActivity[];
}

export interface PillarActivity {
  id: string;
  title: string;
  date: string;
  description: string;
  imageUrl: string;
}

export interface Pillar {
  id: string;
  title: string;
  excerpt: string;
  description: string;
  aim: string;
  imageUrl: string;
  activities: PillarActivity[];
}

// ==========================================
// USER & AUTHENTICATION TYPES & CONSTANTS
// ==========================================

export type UserRole = 'admin' | 'editor' | 'chapter_head' | 'user';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  chapterId?: string;
}

// Storage keys
export const SESSION_TOKEN_KEY = 'dyesabel_session';
export const USER_STORAGE_KEY = 'dyesabel_user';

// Available user roles (for dropdowns, etc.)
export const USER_ROLES = ['editor', 'chapter_head', 'admin'] as const;

// Role display labels
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  editor: 'Editor',
  chapter_head: 'Chapter Head',
  user: 'User'
};

// Role badge colors (Tailwind classes)
export const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-red-500',
  editor: 'bg-blue-500',
  chapter_head: 'bg-green-500',
  user: 'bg-gray-500'
};