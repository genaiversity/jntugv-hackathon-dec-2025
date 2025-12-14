export interface User {
  name: string;
  email: string;
  password?: string; // Optional for Google-only users in a real app, but we'll keep it simple
  pin: string;
}

const STORAGE_KEY = 'askk_ai_users';

// Initial mock user for testing
const DEFAULT_USERS: User[] = [
  { name: 'Mokshayagna Sai Kumar Gompa', email: 'user@askk.ai', password: 'password', pin: '1234' }
];

const getUsers = (): User[] => {
  if (typeof window === 'undefined') return DEFAULT_USERS;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Initialize with default user if empty
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to access localStorage", e);
    return DEFAULT_USERS;
  }
};

const saveUsers = (users: User[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }
};

export const db = {
  /**
   * Check if an email is already registered
   */
  emailExists: (email: string): boolean => {
    const users = getUsers();
    return users.some(u => u.email.toLowerCase() === email.toLowerCase());
  },
  
  /**
   * Get user by email
   */
  getUser: (email: string): User | null => {
    const users = getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  /**
   * Create a new user
   */
  createUser: (user: User): { success: boolean; message?: string } => {
    const users = getUsers();
    
    if (users.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
      return { success: false, message: 'This email is already associated with an account.' };
    }

    users.push(user);
    saveUsers(users);
    return { success: true };
  },

  /**
   * Verify login credentials
   */
  authenticate: (email: string, pass: string): User | null => {
    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);
    return user || null;
  },

  /**
   * Verify System PIN
   * Checks the pin against the specific user's stored pin
   */
  validateSystemPin: (email: string, pin: string): boolean => {
    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) return false;
    
    return user.pin === pin;
  },

  /**
   * Reset User Password
   */
  resetPassword: (email: string, newPass: string): boolean => {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (userIndex === -1) return false;
    
    users[userIndex].password = newPass;
    saveUsers(users);
    return true;
  }
};