
export type TransactionType = 'income' | 'expense' | 'refund';

export type Language = 'en' | 'it' | 'es' | 'fr' | 'de';

export type SubscriptionStatus = 'trial' | 'active' | 'expired';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // Mandatory for auth to work correctly
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

export const OTHER_SUB_CATEGORIES = [
  'Education',
  'Gifts/Donations',
  'Insurance',
  'Taxes',
  'Pets',
  'Travel/Vacation',
  'Personal Care',
  'Investments',
  'Kids',
  'General'
];

export const PLANS = {
  base: { name: 'Savings Base', price: '5€', aiLimit: 1 }, // Changed from 0 to 1
  medium: { name: 'Savings Medium', price: '7€', aiLimit: 5 },
  advanced: { name: 'Savings Advanced', price: '10€', aiLimit: 15 },
  ultra: { name: 'Savings Ultra', price: '15€', aiLimit: 9999 },
};
