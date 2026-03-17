export type Language = 'en' | 'hi' | 'bn' | 'ne' | 'de';
export type Theme = 'light' | 'dark';
export type UserRole = 'owner' | 'manager' | 'staff';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  language: Language;
  theme: Theme;
  orgId?: string;
  businessName?: string;
  role?: UserRole;
  apiKeys?: Record<string, string>;
  onboardingCompleted?: boolean;
}

export interface Organization {
  id: string;
  name: string;
  type: string;
  address: string;
  email: string;
  phone: string;
  ownerId: string;
  createdAt: string;
}

export interface Member {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  joinedAt: string;
}

export interface Invite {
  id: string;
  email: string;
  role: UserRole;
  orgId: string;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: string;
}

export interface Contact {
  id: string;
  orgId: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'lead' | 'customer' | 'inactive';
  aiScore: number;
  lastContacted: string;
}

export interface Deal {
  id: string;
  orgId: string;
  title: string;
  value: number;
  stage: 'prospecting' | 'negotiation' | 'closed-won' | 'closed-lost';
  contactId: string;
}

export interface Product {
  id: string;
  orgId: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
  category: string;
  lifecycleStage: 'idea' | 'launch' | 'active' | 'retire';
}

export interface Transaction {
  id: string;
  orgId: string;
  amount: number;
  items: any[];
  timestamp: string;
  paymentMethod: string;
}

export interface Expense {
  id: string;
  orgId: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  receiptUrl?: string;
}

export interface Invoice {
  id: string;
  orgId: string;
  clientName: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
}
