export type TransactionType = 'income' | 'expense' | 'refund';

export type Language = 'en' | 'it';

export type SubscriptionStatus = 'trial' | 'active' | 'expired';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // In a real app, never store plain text passwords
  createdAt: string; // ISO Date
}

export interface Transaction {
  id: string;
  date: string; // ISO YYYY-MM-DD
  amount: number;
  type: TransactionType;
  category: string;
  note: string;
}

export interface UserSettings {
  username: string;
  plan: 'base' | 'medium' | 'advanced' | 'ultra';
  aiEnabled: boolean;
  currency: string;
  language: Language;
  subscriptionStatus: SubscriptionStatus;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export const CATEGORIES = [
  'Housing/Bills',
  'Transportation',
  'Food/Dining',
  'Shopping',
  'Entertainment',
  'Health',
  'Income',
  'Refund',
  'Other'
];

export const PLANS = {
  base: { name: 'Savings Base', price: '5€', aiLimit: 0 },
  medium: { name: 'Savings Medium', price: '7€', aiLimit: 5 },
  advanced: { name: 'Savings Advanced', price: '10€', aiLimit: 15 },
  ultra: { name: 'Savings Ultra', price: '15€', aiLimit: 9999 },
};