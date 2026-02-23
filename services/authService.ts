import { StorageService } from './storageService';
import { User } from '../types';

export const AuthService = {
    login: (username: string, password: string): User | null => {
        const users = StorageService.getUsers();
        const user = users.find(u => u.username === username && u.password === password);
        return user || null;
    },

    getCurrentUser: (): User | null => {
        const stored = sessionStorage.getItem('icarus_current_user');
        return stored ? JSON.parse(stored) : null;
    },

    setCurrentUser: (user: User) => {
        sessionStorage.setItem('icarus_current_user', JSON.stringify(user));
    },

    logout: () => {
        sessionStorage.removeItem('icarus_current_user');
    }
};