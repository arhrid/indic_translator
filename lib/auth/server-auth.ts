import 'server-only';
import { compare } from 'bcrypt-ts';
import { DUMMY_PASSWORD } from '@/lib/constants';
import { createGuestUser, getUser } from '@/lib/db/queries';

type AuthUser = {
  id: string;
  email: string;
  type: 'guest' | 'regular';
};

export async function verifyCredentials(email: string, password: string): Promise<AuthUser | null> {
  try {
    const users = await getUser(email);

    if (users.length === 0) {
      // Use a constant-time comparison to prevent timing attacks
      await compare(password, DUMMY_PASSWORD);
      return null;
    }

    const user = users[0];
    if (!user.password) return null;
    
    const isValid = await compare(password, user.password);
    if (!isValid) return null;

    return {
      id: user.id,
      email: user.email,
      type: 'regular' as const,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export async function createGuest(): Promise<AuthUser> {
  const guestUser = await createGuestUser();
  return {
    id: guestUser[0].id,
    email: guestUser[0].email || '',
    type: 'guest' as const,
  };
}
