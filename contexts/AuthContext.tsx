import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { User, UserData, DocumentType, ReminderType, EventGroup, ExpenseCategory, IncomeCategory, TransactionType, AssetCategory, DebtCategory, InvestmentCategory, GoalCategory } from '../types';
import { BookOpenIcon, SparklesIcon, HeartIcon } from '../components/Icons';
import { auth, db } from '../services/firebase';
// FIX: Use v8 compatibility layer by importing firebase/app
// Fix: Use v8 compatibility layer by importing firebase/compat/*
// FIX: The compat library should be imported as the default export, not as a namespace.
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

// FIX: Define FirebaseUser type for v8
// FIX: The User type is part of the auth namespace in the compat library.
type FirebaseUser = firebase.auth.User;

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
    activateUser: (uid: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // FIX: Use auth.onAuthStateChanged from v8 auth service
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                // FIX: Use v8 firestore syntax
                const userDocRef = db.collection("users").doc(user.uid);
                const userDoc = await userDocRef.get();
                // FIX: Use .exists property and construct User object safely to fix type error
                if (userDoc.exists) {
                    const data = userDoc.data();
                    setCurrentUser({
                        uid: user.uid,
                        email: data!.email,
                        role: data!.role as 'user' | 'admin',
                        isActive: data!.isActive,
                    });
                } else {
                    // This can happen with Google Sign-in for the first time
                    // Or if doc creation failed during registration
                    setCurrentUser(null); 
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);
    
    const login = async (email: string, pass: string): Promise<User | null> => {
        // FIX: Use auth.signInWithEmailAndPassword from v8 auth service
        const userCredential = await auth.signInWithEmailAndPassword(email, pass);
        // FIX: Use v8 firestore syntax
        const userDocRef = db.collection("users").doc(userCredential.user!.uid);
        const userDoc = await userDocRef.get();
        // FIX: Use .exists property and construct User object safely to fix type error
        if (userDoc.exists) {
            const data = userDoc.data();
            const userData: User = {
                uid: userCredential.user!.uid,
                email: data!.email,
                role: data!.role as 'user' | 'admin',
                isActive: data!.isActive,
            };
            setCurrentUser(userData);
            return userData;
        }
        return null;
    };

    const signInWithGoogle = async (): Promise<User | null> => {
        // FIX: Use firebase.auth.GoogleAuthProvider from v8 SDK
        const provider = new firebase.auth.GoogleAuthProvider();
        // FIX: Use auth.signInWithPopup from v8 auth service
        const result = await auth.signInWithPopup(provider);
        const user = result.user!;

        // Check if user exists in our Firestore 'users' collection
        // FIX: Use v8 firestore syntax
        const userDocRef = db.collection("users").doc(user.uid);
        const userDoc = await userDocRef.get();

        // FIX: Use .exists property
        if (!userDoc.exists) {
            // New user, create documents for them
            const newUserProfile = {
                email: user.email!,
                role: 'user' as const,
                isActive: false, // Google users also need activation
            };
            // FIX: Use .set() for v8
            await userDocRef.set(newUserProfile);
            
            const userDataDocRef = db.collection("userData").doc(user.uid);
            await userDataDocRef.set(getDefaultUserData());
            
            const finalUser: User = { uid: user.uid, ...newUserProfile };
            setCurrentUser(finalUser);
            return finalUser;
        } else {
            // Existing user
            // FIX: Construct User object safely to fix type error
            const data = userDoc.data();
            const existingUser: User = {
                uid: user.uid,
                email: data!.email,
                role: data!.role as 'user' | 'admin',
                isActive: data!.isActive,
            };
            setCurrentUser(existingUser);
            return existingUser;
        }
    };
    
    const register = async (email: string, pass: string): Promise<FirebaseUser | null> => {
        // FIX: Use auth.createUserWithEmailAndPassword from v8 auth service
        const userCredential = await auth.createUserWithEmailAndPassword(email, pass);
        const user = userCredential.user;

        // Create user profile in Firestore
        // FIX: Use v8 firestore syntax
        const userDocRef = db.collection("users").doc(user!.uid);
        // FIX: Use .set() for v8
        await userDocRef.set({
            email: user!.email,
            role: 'user',
            isActive: false, // New users need activation
        });
        
        // Create initial data for the new user
        const userDataDocRef = db.collection("userData").doc(user!.uid);
        await userDataDocRef.set(getDefaultUserData());
        
        return user;
    };

    const logout = async () => {
        // FIX: Use auth.signOut from v8 auth service
        await auth.signOut();
        setCurrentUser(null);
    };

    const getUserData = useCallback(async (): Promise<UserData> => {
        if (!currentUser) throw new Error("User not authenticated");
        // FIX: Use v8 firestore syntax
        const userDataDocRef = db.collection("userData").doc(currentUser.uid);
        const docSnap = await userDataDocRef.get();
        // FIX: Use .exists property
        if (docSnap.exists) {
            return docSnap.data() as UserData;
        }
        return getDefaultUserData(); // Should not happen if registration is correct
    }, [currentUser]);

    const updateUserData = async (data: Partial<UserData>) => {
        if (!currentUser) throw new Error("User not authenticated");
        // FIX: Use v8 firestore syntax
        const userDataDocRef = db.collection("userData").doc(currentUser.uid);
        // FIX: Use .update() for v8
        await userDataDocRef.update(data);
    };
    
    const getAllUsers = async (): Promise<User[]> => {
        // FIX: Use v8 firestore syntax
         const usersCol = db.collection("users");
         const userSnapshot = await usersCol.get();
        // FIX: Construct User object safely to fix type error
         const userList = userSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                uid: doc.id,
                email: data.email,
                role: data.role as 'user' | 'admin',
                isActive: data.isActive,
            };
         });
         return userList;
    };
    
    const activateUser = async (uid: string) => {
        // FIX: Use v8 firestore syntax
        const userDocRef = db.collection("users").doc(uid);
        // FIX: Use .update() for v8
        await userDocRef.update({ isActive: true });
    };

    const value = {
        currentUser, loading, login, signInWithGoogle, register, logout, getUserData, updateUserData, getAllUsers, activateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
