import { Transaction, UserSettings, TransactionType, User, SubscriptionStatus } from '../types';

const STORAGE_KEYS = {
  TRANSACTIONS_PREFIX: 'budget_ai_transactions_',
  SETTINGS_PREFIX: 'budget_ai_settings_',
  USERS: 'budget_ai_users',
  CURRENT_SESSION: 'budget_ai_session_user'
};

const DEFAULT_SETTINGS: UserSettings = {
  username: 'User',
  plan: 'base',
  aiEnabled: true,
  currency: '€',
  language: 'en',
  subscriptionStatus: 'trial'
};

// Helper to generate dynamic dates
const getDaysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

// Rich Mock Data (Only for Demo user)
const DEMO_TRANSACTIONS: Transaction[] = [
  // Income
  { id: '1', date: getDaysAgo(2), amount: 2800, type: 'income', category: 'Income', note: 'Monthly Salary' },
  { id: '2', date: getDaysAgo(15), amount: 150, type: 'income', category: 'Income', note: 'Freelance Project' },
  
  // Expenses - Housing
  { id: '3', date: getDaysAgo(3), amount: 850, type: 'expense', category: 'Housing/Bills', note: 'Monthly Rent' },
  { id: '4', date: getDaysAgo(5), amount: 120, type: 'expense', category: 'Housing/Bills', note: 'Electricity Bill' },
  { id: '5', date: getDaysAgo(5), amount: 45, type: 'expense', category: 'Housing/Bills', note: 'Internet' },
  
  // Expenses - Food
  { id: '6', date: getDaysAgo(0), amount: 85.50, type: 'expense', category: 'Food/Dining', note: 'Weekly Groceries' },
  { id: '7', date: getDaysAgo(1), amount: 12.00, type: 'expense', category: 'Food/Dining', note: 'Lunch at work' },
  { id: '8', date: getDaysAgo(4), amount: 65.00, type: 'expense', category: 'Food/Dining', note: 'Dinner with friends' },
  { id: '9', date: getDaysAgo(7), amount: 90.20, type: 'expense', category: 'Food/Dining', note: 'Supermarket' },
  
  // Expenses - Transport
  { id: '10', date: getDaysAgo(2), amount: 50.00, type: 'expense', category: 'Transportation', note: 'Gas Refill' },
  { id: '11', date: getDaysAgo(10), amount: 35.00, type: 'expense', category: 'Transportation', note: 'Train Ticket' },
  
  // Expenses - Lifestyle
  { id: '12', date: getDaysAgo(1), amount: 15.99, type: 'expense', category: 'Entertainment', note: 'Netflix Subscription' },
  { id: '13', date: getDaysAgo(6), amount: 45.00, type: 'expense', category: 'Health', note: 'Gym Membership' },
  { id: '14', date: getDaysAgo(8), amount: 120.00, type: 'expense', category: 'Shopping', note: 'New Sneakers' },
  
  // Refund
  { id: '15', date: getDaysAgo(12), amount: 30.00, type: 'refund', category: 'Refund', note: 'Returned Item Amazon' },
];

export const storageService = {
  // Auth Methods
  auth: {
    getUsers: (): User[] => {
      const stored = localStorage.getItem(STORAGE_KEYS.USERS);
      return stored ? JSON.parse(stored) : [];
    },

    register: (user: Omit<User, 'id' | 'createdAt'>) => {
      const users = storageService.auth.getUsers();
      if (users.find(u => u.email === user.email)) {
        throw new Error('Email already registered');
      }
      const newUser: User = { 
        ...user, 
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString()
      };
      users.push(newUser);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      
      // Initialize Default Settings for this specific user ID
      const settings = { ...DEFAULT_SETTINGS, username: newUser.name, subscriptionStatus: 'trial' as const };
      localStorage.setItem(`${STORAGE_KEYS.SETTINGS_PREFIX}${newUser.id}`, JSON.stringify(settings));
      
      // Initialize Empty Transactions for this specific user ID
      localStorage.setItem(`${STORAGE_KEYS.TRANSACTIONS_PREFIX}${newUser.id}`, JSON.stringify([]));

      return newUser;
    },

    login: (email: string, password: string): User => {
      // Special Admin Backdoor
      if (email === 'admin@budgetai.com' && password === 'admin') {
         const adminUser: User = {
             id: 'admin_master',
             name: 'System Admin',
             email: 'admin@budgetai.com',
             createdAt: new Date().toISOString()
         };
         // Admin always active
         const settings = { ...DEFAULT_SETTINGS, username: 'Admin', subscriptionStatus: 'active' as const, plan: 'ultra' as const };
         localStorage.setItem(`${STORAGE_KEYS.SETTINGS_PREFIX}admin_master`, JSON.stringify(settings));
         localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(adminUser));
         return adminUser;
      }

      const users = storageService.auth.getUsers();
      // Simple mock check
      const user = users.find(u => u.email === email && u.password === password);
      
      if (!user) {
        // Fallback for demo
        if ((users.length === 0 || email === 'demo@example.com') && password === 'demo') {
           const demoUser: User = { 
             id: 'demo_user_id', 
             name: 'Mirco (Demo)', 
             email: 'demo@example.com',
             createdAt: new Date().toISOString() // Demo starts fresh on login
           };
           // Note: Settings for demo user are handled in getSettings to persist Admin changes
           localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(demoUser));
           return demoUser;
        }
        throw new Error('Invalid credentials');
      },

      // Check Trial Status on Login
      storageService.checkSubscriptionStatus(user);

      localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(user));
      return user;
    },

    logout: () => {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
    },

    getCurrentUser: (): User | null => {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
      return stored ? JSON.parse(stored) : null;
    },
    
    updateCurrentUser: (data: Partial<User>) => {
      const currentUser = storageService.auth.getCurrentUser();
      if (!currentUser) return;
      
      const updatedUser = { ...currentUser, ...data };
      
      // Update session
      localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(updatedUser));
      
      // Update main DB list if not demo/admin
      if (currentUser.id !== 'admin_master' && currentUser.id !== 'demo_user_id') {
         const users = storageService.auth.getUsers();
         const index = users.findIndex(u => u.id === currentUser.id);
         if (index !== -1) {
             users[index] = updatedUser;
             localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
         }
      }
      return updatedUser;
    },

    deleteAccount: () => {
      const user = storageService.auth.getCurrentUser();
      if (!user) return;

      const users = storageService.auth.getUsers().filter(u => u.id !== user.id);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      
      localStorage.removeItem(`${STORAGE_KEYS.SETTINGS_PREFIX}${user.id}`);
      localStorage.removeItem(`${STORAGE_KEYS.TRANSACTIONS_PREFIX}${user.id}`);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
    }
  },

  // Admin Methods
  admin: {
    getAllUsersData: () => {
      const users = storageService.auth.getUsers();
      
      // Inject Demo user for Admin visualization
      // FIX: Read actual settings from storage if they exist, to show updated plan
      const demoId = 'demo_user_id';
      const demoSettingsStr = localStorage.getItem(`${STORAGE_KEYS.SETTINGS_PREFIX}${demoId}`);
      const demoSettings = demoSettingsStr 
          ? JSON.parse(demoSettingsStr) 
          : { ...DEFAULT_SETTINGS, username: 'Mirco (Demo)', subscriptionStatus: 'active' as const };

      const demoUser = {
        id: demoId,
        name: 'Mirco (Demo)',
        email: 'demo@example.com',
        createdAt: new Date().toISOString(),
        settings: demoSettings,
        trialDaysLeft: 0
      };

      const mappedUsers = users.map(user => {
        const settingsStr = localStorage.getItem(`${STORAGE_KEYS.SETTINGS_PREFIX}${user.id}`);
        const settings = settingsStr ? JSON.parse(settingsStr) : DEFAULT_SETTINGS;
        
        // Calculate trial days left
        const created = new Date(user.createdAt).getTime();
        const now = new Date().getTime();
        const diffDays = (now - created) / (1000 * 3600 * 24);
        const trialDaysLeft = Math.max(0, Math.ceil(7 - diffDays));

        return {
          ...user,
          settings,
          trialDaysLeft
        };
      });
      
      // Prepend demo user
      return [demoUser, ...mappedUsers];
    },

    updateUserSubscription: (userId: string, plan: string, status: SubscriptionStatus) => {
      const key = `${STORAGE_KEYS.SETTINGS_PREFIX}${userId}`;
      const stored = localStorage.getItem(key);
      const settings = stored ? JSON.parse(stored) : { ...DEFAULT_SETTINGS };
      
      settings.plan = plan;
      settings.subscriptionStatus = status;
      
      localStorage.setItem(key, JSON.stringify(settings));
    },

    resetUserPassword: (userId: string, newPassword: string) => {
      const users = storageService.auth.getUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        users[userIndex].password = newPassword;
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }
    },

    deleteUser: (userId: string) => {
       const users = storageService.auth.getUsers().filter(u => u.id !== userId);
       localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
       localStorage.removeItem(`${STORAGE_KEYS.SETTINGS_PREFIX}${userId}`);
       localStorage.removeItem(`${STORAGE_KEYS.TRANSACTIONS_PREFIX}${userId}`);
    },

    extendTrial: (userId: string, days: number) => {
      // To extend trial, we cheat by moving the createdAt date forward
      const users = storageService.auth.getUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
         const currentCreated = new Date(users[userIndex].createdAt);
         currentCreated.setDate(currentCreated.getDate() + days);
         users[userIndex].createdAt = currentCreated.toISOString();
         localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
         
         // Also verify status is 'trial' or reset it if expired
         const key = `${STORAGE_KEYS.SETTINGS_PREFIX}${userId}`;
         const stored = localStorage.getItem(key);
         const settings = stored ? JSON.parse(stored) : { ...DEFAULT_SETTINGS };
         if (settings.subscriptionStatus === 'expired') {
            settings.subscriptionStatus = 'trial';
            localStorage.setItem(key, JSON.stringify(settings));
         }
      }
    }
  },

  // Subscription Logic
  checkSubscriptionStatus: (user: User) => {
    // Demo user is always active (unless changed by admin manually)
    if (user.id === 'admin_master') return;
    if (user.id === 'demo_user_id') {
        // We still check settings for Demo in case Admin set it to expired manually
        const key = `${STORAGE_KEYS.SETTINGS_PREFIX}${user.id}`;
        const stored = localStorage.getItem(key);
        if (stored) {
            const settings = JSON.parse(stored);
            if (settings.subscriptionStatus === 'active') return;
        } else {
            return; // Default demo is active
        }
    }

    const settingsKey = `${STORAGE_KEYS.SETTINGS_PREFIX}${user.id}`;
    const storedSettings = localStorage.getItem(settingsKey);
    let settings = storedSettings ? JSON.parse(storedSettings) : { ...DEFAULT_SETTINGS };

    if (settings.subscriptionStatus === 'active') return;

    const created = new Date(user.createdAt).getTime();
    const now = new Date().getTime();
    const diffDays = (now - created) / (1000 * 3600 * 24);

    if (diffDays > 7) {
      settings.subscriptionStatus = 'expired';
      localStorage.setItem(settingsKey, JSON.stringify(settings));
    }
  },

  activateSubscription: () => {
    const user = storageService.auth.getCurrentUser();
    if (!user) return;
    
    storageService.updateSettings({ subscriptionStatus: 'active' });
  },

  getTrialDaysLeft: (): number => {
    const user = storageService.auth.getCurrentUser();
    if (!user || user.id === 'demo_user_id' || user.id === 'admin_master') return 7;

    const created = new Date(user.createdAt).getTime();
    const now = new Date().getTime();
    const diffDays = (now - created) / (1000 * 3600 * 24);
    
    return Math.max(0, Math.ceil(7 - diffDays));
  },

  // Data Methods (Now User Specific)
  getTransactions: (): Transaction[] => {
    const user = storageService.auth.getCurrentUser();
    if (!user) return [];

    const key = `${STORAGE_KEYS.TRANSACTIONS_PREFIX}${user.id}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      // If it's the special demo user, give them mock data
      if (user.email === 'demo@example.com') {
        localStorage.setItem(key, JSON.stringify(DEMO_TRANSACTIONS));
        return DEMO_TRANSACTIONS;
      }
      // Everyone else starts empty
      return [];
    }
    return JSON.parse(stored);
  },

  addTransaction: (transaction: Transaction) => {
    const user = storageService.auth.getCurrentUser();
    if (!user) return [];

    const current = storageService.getTransactions();
    const updated = [...current, transaction];
    
    const key = `${STORAGE_KEYS.TRANSACTIONS_PREFIX}${user.id}`;
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  },

  deleteTransaction: (id: string) => {
    const user = storageService.auth.getCurrentUser();
    if (!user) return [];

    const current = storageService.getTransactions();
    const updated = current.filter(t => t.id !== id);
    
    const key = `${STORAGE_KEYS.TRANSACTIONS_PREFIX}${user.id}`;
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  },
  
  // NEW: Import transactions for data migration
  importTransactions: (transactions: Transaction[]) => {
      const user = storageService.auth.getCurrentUser();
      if (!user) return;
      
      const key = `${STORAGE_KEYS.TRANSACTIONS_PREFIX}${user.id}`;
      localStorage.setItem(key, JSON.stringify(transactions));
      return transactions;
  },

  getSettings: (): UserSettings => {
    const user = storageService.auth.getCurrentUser();
    if (!user) return DEFAULT_SETTINGS;

    // FIX: Check Storage FIRST. If admin updated demo user, it's in storage.
    const key = `${STORAGE_KEYS.SETTINGS_PREFIX}${user.id}`;
    const stored = localStorage.getItem(key);
    
    if (stored) {
        const settings = JSON.parse(stored);
        
        // Subscription checks for non-active users
        if (settings.subscriptionStatus !== 'active' && user.id !== 'admin_master') {
             const created = new Date(user.createdAt).getTime();
             const now = new Date().getTime();
             if ((now - created) / (1000 * 3600 * 24) > 7) {
                settings.subscriptionStatus = 'expired';
                localStorage.setItem(key, JSON.stringify(settings));
             }
        }
        return settings;
    }

    // Initialize logic if not in storage
    if (user.email === 'demo@example.com') {
       // First time demo load (or storage cleared)
       const demoSettings: UserSettings = { 
           ...DEFAULT_SETTINGS, 
           username: 'Mirco (Demo)', 
           subscriptionStatus: 'active' 
       };
       // Save it so future admin edits have something to overwrite
       localStorage.setItem(key, JSON.stringify(demoSettings));
       return demoSettings;
    }

    // Standard User Initialize
    const initial = { ...DEFAULT_SETTINGS, username: user.name, subscriptionStatus: 'trial' as const };
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  },

  updateSettings: (settings: Partial<UserSettings>) => {
    const user = storageService.auth.getCurrentUser();
    if (!user) return DEFAULT_SETTINGS;

    const current = storageService.getSettings();
    const updated = { ...current, ...settings };
    
    const key = `${STORAGE_KEYS.SETTINGS_PREFIX}${user.id}`;
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  },

  // Helper to get totals for analysis
  getFinancialSummary: () => {
    const transactions = storageService.getTransactions();
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
    const currentDay = now.getDate();
    
    const monthlyData = transactions.filter(t => t.date.startsWith(currentMonth));
    
    const income = monthlyData.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = monthlyData.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const refund = monthlyData.filter(t => t.type === 'refund').reduce((sum, t) => sum + t.amount, 0);

    // Calculate categories
    const categories: Record<string, number> = {};
    monthlyData.filter(t => t.type === 'expense').forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });

    // Find top category
    let topCategory = { name: 'None', amount: 0 };
    Object.entries(categories).forEach(([name, amount]) => {
      if (amount > topCategory.amount) {
        topCategory = { name, amount };
      }
    });

    // Get recent 5 transactions (sorted by date desc)
    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return {
      totalIncome: income,
      totalExpense: expense,
      totalRefund: refund,
      balance: income + refund - expense,
      categoryBreakdown: categories,
      transactionCount: monthlyData.length,
      topCategory,
      dailyAverage: currentDay > 0 ? expense / currentDay : 0,
      savingsRate: income > 0 ? ((income - expense) / income) * 100 : 0,
      recentTransactions
    };
  }
};