import { db, auth } from '../firebase';
import { collection, addDoc, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

// Interface for user data
export interface Player {
    id: string;
    email?: string;
    name: string;
    playerID?: string;
    venue?: string;
    batch?: string;
    position?: string;
    registeredAt?: Date | string;
}

// ✅ ADMIN: Create new user account and save to Firestore
export async function createPlayerAccount(
    email: string,
    password: string | undefined, // Added undefined for safety if admin doesn't set one initially
    playerData: {
        name: string;
        playerID: string;
        venue: string;
        batch: string;
        position: string;
    }
) {
    try {
        // Step 1: Create Firebase Authentication account
        // If no password provided, we can either throw an error or use a default one for now
        const safePassword = password || "icarusdefault2024!";

        // Note: It's better to let players set their own password or send them a registration link, 
        // but we'll stick to the admin creation flow for now
        const userCredential = await createUserWithEmailAndPassword(auth, email, safePassword);
        const uid = userCredential.user.uid;

        // Step 2: Save player details to Firestore
        const playerDocRef = doc(db, 'players', uid);
        await setDoc(playerDocRef, {
            uid: uid,
            email: email,
            name: playerData.name,
            playerID: playerData.playerID,
            venue: playerData.venue,
            batch: playerData.batch,
            position: playerData.position,
            createdAt: new Date(),
            role: 'player' // Optional: for future role-based access
        });

        return {
            success: true,
            uid: uid,
            message: 'Player account created successfully!'
        };
    } catch (error: any) {
        console.error('Error creating player account:', error);
        return {
            success: false,
            message: error.message || 'Failed to create account'
        };
    }
}

// ✅ LOGIN: Verify credentials from Firebase Auth
export async function loginPlayer(email: string, password: string) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // Fetch player data from Firestore
        const playerDoc = await getDoc(doc(db, 'players', uid));

        if (playerDoc.exists()) {
            return {
                success: true,
                user: {
                    uid: uid,
                    ...playerDoc.data()
                },
                message: 'Login successful!'
            };
        } else {
            // It's possible the user is an admin or coach whose data is in a different collection
            return {
                success: true,
                user: {
                    uid: uid,
                    email: email,
                    role: 'user' // Default role if not found in players
                },
                message: 'Login successful, but player profile not found.'
            };
        }
    } catch (error: any) {
        console.error('Login error:', error);
        return {
            success: false,
            message: error.message || 'Invalid username or password'
        };
    }
}

// ✅ Get all players (for admin dashboard)
export async function getAllPlayers() {
    try {
        const playersRef = collection(db, 'players');
        const snapshot = await getDocs(playersRef);
        const players: Player[] = [];

        snapshot.forEach((doc) => {
            players.push({
                id: doc.id,
                ...doc.data()
            } as Player);
        });

        return {
            success: true,
            players: players
        };
    } catch (error: any) {
        console.error('Error fetching players:', error);
        return {
            success: false,
            players: [],
            message: error.message
        };
    }
}

// ✅ Get single player data
export async function getPlayerData(uid: string) {
    try {
        const playerDoc = await getDoc(doc(db, 'players', uid));

        if (playerDoc.exists()) {
            return {
                success: true,
                player: {
                    id: playerDoc.id,
                    ...playerDoc.data()
                }
            };
        } else {
            return {
                success: false,
                message: 'Player not found'
            };
        }
    } catch (error: any) {
        console.error('Error fetching player:', error);
        return {
            success: false,
            message: error.message
        };
    }
}
