import { db, auth } from './services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const seedData = async () => {
    try {
        console.log('Starting Firestore Seeding...');

        // 1. Create Admin Account
        const adminEmail = 'admin@icarus.demo';
        const adminPassword = 'admin123';

        let adminUid = '';
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
            adminUid = userCredential.user.uid;
            console.log('Admin Auth account created');
        } catch (authError: any) {
            if (authError.code === 'auth/email-already-in-use') {
                console.log('Admin Auth account already exists');
                // We might need to handle this by signing in instead if we really need the UID, 
                // but for now let's assume it's created if it doesn't exist.
            } else {
                throw authError;
            }
        }

        // 2. Add Admin to Firestore (if UID available)
        if (adminUid) {
            await setDoc(doc(db, 'users', adminUid), {
                uid: adminUid,
                email: adminEmail,
                name: 'Super Admin',
                role: 'admin',
                createdAt: new Date()
            });
            console.log('Admin added to Firestore');
        }

        // 3. Create Sample Coach
        const coachEmail = 'coach@icarus.demo';
        const coachPassword = 'coach123';

        try {
            const coachCredential = await createUserWithEmailAndPassword(auth, coachEmail, coachPassword);
            const coachUid = coachCredential.user.uid;

            await setDoc(doc(db, 'users', coachUid), {
                uid: coachUid,
                email: coachEmail,
                name: 'Head Coach',
                role: 'coach',
                createdAt: new Date()
            });
            console.log('Coach created and added to Firestore');
        } catch (e) {
            console.log('Coach already exists or error:', e);
        }

        // 4. Create Sample Player (Leo)
        const playerEmail = 'leo@icarus.demo';
        const playerPassword = 'leo123';

        try {
            const playerCredential = await createUserWithEmailAndPassword(auth, playerEmail, playerPassword);
            const playerUid = playerCredential.user.uid;

            await setDoc(doc(db, 'players', playerUid), {
                uid: playerUid,
                email: playerEmail,
                name: 'Leo Messi',
                playerID: 'ICR-0010',
                venue: 'Main Campus',
                batch: 'Elite',
                position: 'Forward',
                role: 'player',
                createdAt: new Date()
            });
            console.log('Player created and added to Firestore');
        } catch (e) {
            console.log('Player already exists or error:', e);
        }

        console.log('Seeding Complete!');
    } catch (error) {
        console.error('Seeding Failed:', error);
    }
};

// This script is intended to be run in a browser console or via a temporary import in App.tsx
// To keep it simple for the user, I will not include a complex node execution environment.
// Instead, I'll add a helper to the App.tsx that triggers this on a specific condition.
export default seedData;
