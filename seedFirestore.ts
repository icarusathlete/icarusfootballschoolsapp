import { db, auth } from './services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

const seedData = async () => {
    try {
        console.log('Starting Firestore Seeding...');

        const usersToSeed = [
            { email: 'admin@icarus.demo', password: 'admin123', name: 'Super Admin', role: 'admin', collection: 'users' },
            { email: 'coach@icarus.demo', password: 'coach123', name: 'Head Coach', role: 'coach', collection: 'users' },
            {
                email: 'leo@icarus.demo', password: 'leo123', name: 'Leo Messi', role: 'player', collection: 'players',
                additionalData: { playerID: 'ICR-0010', venue: 'Main Campus', batch: 'Elite', position: 'Forward' }
            }
        ];

        for (const user of usersToSeed) {
            let uid = '';
            try {
                // Try to create the user
                const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
                uid = userCredential.user.uid;
                console.log(`Auth account created for ${user.email}`);
            } catch (authError: any) {
                if (authError.code === 'auth/email-already-in-use') {
                    // Sign in to get the UID
                    const userCredential = await signInWithEmailAndPassword(auth, user.email, user.password);
                    uid = userCredential.user.uid;
                    console.log(`Auth account already exists for ${user.email}, retrieved UID`);
                } else {
                    console.error(`Auth error for ${user.email}:`, authError);
                    continue;
                }
            }

            if (uid) {
                const data = {
                    uid,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    createdAt: new Date(),
                    ...(user.additionalData || {})
                };
                await setDoc(doc(db, user.collection, uid), data);
                console.log(`Document added to ${user.collection} for ${user.name}`);
            }
        }

        console.log('Seeding Complete!');
    } catch (error) {
        console.error('Seeding Failed:', error);
        throw error;
    }
};

export default seedData;
