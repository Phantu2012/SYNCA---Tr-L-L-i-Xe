import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { User, UserData, DocumentType, ReminderType, EventGroup, ExpenseCategory, IncomeCategory, TransactionType, AssetCategory, DebtCategory, InvestmentCategory, GoalCategory } from '../types';
import { BookOpenIcon, SparklesIcon, HeartIcon } from '../components/Icons';
import { auth, db } from '../services/firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    User as FirebaseUser
} from 'firebase/auth';
import { 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    getDocs,
    updateDoc,
    query,
    where
} from 'firebase/firestore';

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


interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    login: (email: string, pass: string) => Promise<User | null>;
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
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDocRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setCurrentUser({ uid: user.uid, ...userDoc.data() } as User);
                } else {
                    // This case might happen if user doc creation failed during registration
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
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        const userDocRef = doc(db, "users", userCredential.user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const userData = { uid: userCredential.user.uid, ...userDoc.data() } as User;
            setCurrentUser(userData);
            return userData;
        }
        return null;
    };
    
    const register = async (email: string, pass: string): Promise<FirebaseUser | null> => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;

        // Create user profile in Firestore
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, {
            email: user.email,
            role: 'user',
            isActive: false, // New users need activation
        });
        
        // Create initial data for the new user
        const userDataDocRef = doc(db, "userData", user.uid);
        await setDoc(userDataDocRef, getDefaultUserData());
        
        return user;
    };

    const logout = async () => {
        await signOut(auth);
        setCurrentUser(null);
    };

    const getUserData = useCallback(async (): Promise<UserData> => {
        if (!currentUser) throw new Error("User not authenticated");
        const userDataDocRef = doc(db, "userData", currentUser.uid);
        const docSnap = await getDoc(userDataDocRef);
        if (docSnap.exists()) {
            return docSnap.data() as UserData;
        }
        return getDefaultUserData(); // Should not happen if registration is correct
    }, [currentUser]);

    const updateUserData = async (data: Partial<UserData>) => {
        if (!currentUser) throw new Error("User not authenticated");
        const userDataDocRef = doc(db, "userData", currentUser.uid);
        // Using updateDoc with dot notation for partial updates
        await updateDoc(userDataDocRef, data);
    };
    
    const getAllUsers = async (): Promise<User[]> => {
         const usersCol = collection(db, "users");
         const userSnapshot = await getDocs(usersCol);
         const userList = userSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
         return userList;
    };
    
    const activateUser = async (uid: string) => {
        const userDocRef = doc(db, "users", uid);
        await updateDoc(userDocRef, { isActive: true });
    };

    const value = {
        currentUser, loading, login, register, logout, getUserData, updateUserData, getAllUsers, activateUser,
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