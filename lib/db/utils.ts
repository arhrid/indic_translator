import { generateId } from "ai";

// This file should only be imported on the server
let bcrypt: any;

// Using dynamic import for ESM compatibility
const loadBcrypt = async () => {
  if (typeof window === 'undefined') {
    try {
      return await import('bcrypt-ts');
    } catch (e) {
      console.error('Failed to load bcrypt-ts:', e);
      return null;
    }
  }
  return null;
};

// Re-export the functions we need with server-side checks
export const genSaltSync = async (rounds?: number): Promise<string> => {
  if (typeof window !== 'undefined') {
    throw new Error('bcrypt-ts is only available on the server');
  }
  
  const bcrypt = await loadBcrypt();
  if (!bcrypt) {
    throw new Error('bcrypt-ts is not available');
  }
  return bcrypt.genSaltSync(rounds);
};

export const hashSync = async (data: string, salt: string): Promise<string> => {
  if (typeof window !== 'undefined') {
    throw new Error('bcrypt-ts is only available on the server');
  }
  
  const bcrypt = await loadBcrypt();
  if (!bcrypt) {
    throw new Error('bcrypt-ts is not available');
  }
  return bcrypt.hashSync(data, salt);
};

export async function generateHashedPassword(password: string): Promise<string> {
  const salt = await genSaltSync(10);
  const hash = await hashSync(password, salt);
  return hash;
}

export async function generateDummyPassword(): Promise<string> {
  const password = generateId();
  const hashedPassword = await generateHashedPassword(password);
  return hashedPassword;
}
