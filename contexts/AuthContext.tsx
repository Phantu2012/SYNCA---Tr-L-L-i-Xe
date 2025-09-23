import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { User, UserData, DocumentType, ReminderType, EventGroup, ExpenseCategory, IncomeCategory, TransactionType, AssetCategory, DebtCategory, InvestmentCategory, GoalCategory } from '../types';
import { BookOpenIcon, SparklesIcon, HeartIcon } from '../components/Icons';
import { auth, db } from '../services/firebase';
// Fix: Import firebase to provide types for the global firebase object.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';


// --- Default Data for New Users ---
const getDefaultUserData = (): UserData => ({
    documents: [
        { id: '1', type: DocumentType.REGISTRATION, expiryDate: '2024-08-20', notes: 'Đăng kiểm lần đầu', reminderSettings: [7, 14] },
    ],
    events: [
        { id: '1', group: EventGroup.FAMILY, type: ReminderType.BIRTHDAY, title: 'Sinh nhật Mẹ', date: '1965-08-25', time: '08:30', calendarType: 'solar', reminderSettings: [1, 3], repeat: 'yearly' },
    ],
    vehicleLog: [
        { id: '1', date: '2024-06-15', mileage: 15000, service: 'Thay dầu, lọc dầu', cost: 1200000, notes: 'Dầu Mobil 1' },
    ],
    selfDevelopment: {
        gratitude: [ { id: '1', date: new Date().toISOString().slice(0, 10), content: ['Một ngày nắng đẹp', 'Bữa tối ngon miệng'] }, ],
        deeds: [],
        habits: [ { id: 'h1', name: 'Đọc sách 30 phút', icon: <BookOpenIcon />, color: 'text-blue-400' }, { id: 'h2', name: 'Thiền 10 phút', icon: <SparklesIcon />, color: 'text-purple-400' }, { id: 'h3', name: 'Tập thể dục', icon: <HeartIcon />, color: 'text-red-400' }, ],
        habitLog: {},
    },
    lifeGoals: {
        goals: [ { id: 'g1', category: GoalCategory.CAREER, title: 'Tự do tài chính trước tuổi 40', actionSteps: [ { id: 's1', text: 'Tạo quỹ khẩn cấp 6 tháng chi phí', isCompleted: true }, { id: 's2', text: 'Đầu tư 20% thu nhập hàng tháng', isCompleted: false }, ] }, ],
        visions: [],
    },
    financials: {
        transactions: [ { id: 't1', type: TransactionType.EXPENSE, category: ExpenseCategory.FOOD, amount: 250000, date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().slice(0, 10), notes: 'Đi siêu thị cuối tuần' }, { id: 't2', type: TransactionType.INCOME, category: IncomeCategory.SALARY, amount: 20000000, date: new Date(new Date().getFullYear(), new Date().getMonth(), 5).toISOString().slice(0, 10), notes: 'Lương tháng này' }, ],
        assets: [ { id: 'a1', name: 'Tài khoản tiết kiệm Techcombank', category: AssetCategory.SAVINGS, value: 100000000, notes: 'Sổ tiết kiệm 1 năm' }, ],
        debts: [],
        investments: [],
    }
});

// Fix: Corrected the Firebase User type to use `firebase.User`.
type FirebaseUser = firebase.User;

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    login: (email: string, pass: string) => Promise<User | null>;
    signInWithGoogle: () => Promise<User | null>;
    register: (email: string, pass: string) => Promise<FirebaseUser | null>;
    logout: () => void;
    getUserData: () => Promise<UserData>;
    updateUserData: (data: Partial<UserData>) => Promise<void>;
    getAllUsers: () => Promise<User[]>;
    updateUser: (uid: string, data: { isActive?: boolean; expiryDate?: string | null }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Fix: Export useAuth hook to be used in other components.
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Fix: Implement AuthProvider to provide context value and return JSX, fixing the component's return type.
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUserDocument = useCallback(async (firebaseUser: FirebaseUser): Promise<User> => {
        const userDocRef = db.collection('users').doc(firebaseUser.uid);
        const doc = await userDocRef.get();
        if (doc.exists) {
            return { uid: firebaseUser.uid, email: firebaseUser.email!, ...doc.data() } as User;
        } else {
            // This is a new user, create a document for them
            const newUser: Omit<User, 'uid' | 'email'> = {
                role: 'user',
                isActive: false, // Wait for admin approval
            };
            await userDocRef.set(newUser);
            
            const userData: User = {
                ...newUser,
                uid: firebaseUser.uid,
                email: firebaseUser.email!,
            };
            
            // Also create user data subcollection
            await userDocRef.collection('data').doc('main').set(getDefaultUserData());
            return userData;
        }
    }, []);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
            if (firebaseUser) {
                const userProfile = await fetchUserDocument(firebaseUser);
                setCurrentUser(userProfile);
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, [fetchUserDocument]);

    const login = async (email: string, pass: string): Promise<User | null> => {
        const { user: firebaseUser } = await auth.signInWithEmailAndPassword(email, pass);
        if (firebaseUser) {
            return await fetchUserDocument(firebaseUser);
        }
        return null;
    };

    const signInWithGoogle = async (): Promise<User | null> => {
        const provider = new firebase.auth.GoogleAuthProvider();
        const { user: firebaseUser } = await auth.signInWithPopup(provider);
        if (firebaseUser) {
            return await fetchUserDocument(firebaseUser);
        }
        return null;
    };

    const register = async (email: string, pass: string): Promise<FirebaseUser | null> => {
        const { user: firebaseUser } = await auth.createUserWithEmailAndPassword(email, pass);
        if (firebaseUser) {
            await fetchUserDocument(firebaseUser);
        }
        return firebaseUser;
    };

    const logout = () => {
        return auth.signOut();
    };

    const getUserData = useCallback(async (): Promise<UserData> => {
        if (!currentUser) throw new Error("Not logged in");
        const dataDocRef = db.collection('users').doc(currentUser.uid).collection('data').doc('main');
        const doc = await dataDocRef.get();
        if (doc.exists) {
            return doc.data() as UserData;
        }
        const defaultData = getDefaultUserData();
        await dataDocRef.set(defaultData);
        return defaultData;
    }, [currentUser]);

    const updateUserData = useCallback(async (data: Partial<UserData>) => {
        if (!currentUser) throw new Error("Not logged in");
        const dataDocRef = db.collection('users').doc(currentUser.uid).collection('data').doc('main');
        await dataDocRef.set(data, { merge: true });
    }, [currentUser]);

    const getAllUsers = async (): Promise<User[]> => {
        const snapshot = await db.collection('users').get();
        return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
    };

    const updateUser = async (uid: string, data: { isActive?: boolean; expiryDate?: string | null }) => {
        const userDocRef = db.collection('users').doc(uid);
        await userDocRef.update(data);
    };

    const value: AuthContextType = {
        currentUser,
        loading,
        login,
        signInWithGoogle,
        register,
        logout,
        getUserData,
        updateUserData,
        getAllUsers,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
