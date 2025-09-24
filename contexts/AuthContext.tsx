import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { User, UserData, DocumentType, ReminderType, EventGroup, ExpenseCategory, IncomeCategory, TransactionType, AssetCategory, DebtCategory, InvestmentCategory, GoalCategory } from '../types';
import { auth, db, firebase } from '../services/firebase';

type FirebaseUser = firebase.User;

// --- CHẾ ĐỘ NHÀ PHÁT TRIỂN (DEV MODE) ---
// Đặt thành `true` để bỏ qua màn hình đăng nhập và sử dụng dữ liệu giả (offline).
// Dữ liệu sẽ được lưu vào localStorage để mô phỏng tính bền vững.
// Đặt thành `false` để kết nối với Firebase (online).
const DEV_MODE = true;

// Dữ liệu người dùng giả cho DEV_MODE
const MOCK_USER: User = {
  uid: 'dev-user-01',
  email: 'dev@synca.app',
  role: 'admin',
  isActive: true,
  subscriptionTier: 'pro',
  expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], 
};


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
        habits: [
            { id: 'h1', name: 'Đọc sách 30 phút', icon: 'BookOpenIcon', color: 'text-blue-400' },
            { id: 'h2', name: 'Thiền 10 phút', icon: 'SparklesIcon', color: 'text-purple-400' },
            { id: 'h3', name: 'Tập thể dục', icon: 'HeartIcon', color: 'text-red-400' },
        ],
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
    },
    happyFamily: {
        members: [
            { id: 'm1', name: 'Bố' },
            { id: 'm2', name: 'Mẹ' },
            { id: 'm3', name: 'Ben' },
            { id: 'm4', name: 'Anna' },
        ],
        tasks: [
             { id: 'task1', title: 'Dọn dẹp phòng khách', assigneeId: 'm2', deadline: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().slice(0, 10), priority: 'medium', status: 'pending', steps: [{id: 's1', text: 'Lau bụi', isCompleted: false}, {id: 's2', text: 'Hút bụi sàn', isCompleted: false}] },
             { id: 'task2', title: 'Đi siêu thị mua đồ ăn tuần', assigneeId: 'm1', deadline: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().slice(0, 10), priority: 'high', status: 'overdue', steps: [] },
             // Fix: Corrected the 'priority' and added the 'status' for the task.
             { id: 'task3', title: 'Hoàn thành bài tập toán', assigneeId: 'm3', deadline: new Date().toISOString().slice(0, 10), priority: 'high', status: 'completed', steps: [] },
        ],
        achievements: [
            { id: 'ach1', childId: 'm3', subject: 'Toán', score: 10, date: new Date().toISOString().slice(0, 10) },
            { id: 'ach2', childId: 'm4', subject: 'Văn', score: 9, date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString().slice(0, 10) },
        ],
        defaultChecklistItems: [
            { id: 'c1', text: 'Dậy trước 7H' },
            { id: 'c2', text: 'Dọn dẹp gọn gàng chăn màn, quần áo và bàn học' },
            { id: 'c3', text: 'Giúp đỡ bố mẹ dọn nhà & nấu cơm & rửa bát' },
            { id: 'c4', text: 'Lễ Phép chào hỏi người lớn' },
            { id: 'c5', text: 'Làm xong bài tập và chuẩn bị bài cho ngày hôm sau' },
            { id: 'c6', text: 'Chuẩn bị quần áo cho ngày hôm sau' },
            { id: 'c7', 'text': 'Làm được việc tốt - 1 Hành động tử tế' },
            { id: 'c8', text: 'Học tiếng Anh 15-30 phút' },
            { id: 'c9', text: 'Đọc sách' },
            { id: 'c10', text: 'Gấp quần áo trên máy sấy nếu có' },
        ],
        customChecklists: {},
        checklistLogs: {},
        checklistRewardConfig: {
            targetPoints: 80,
            reward: 'Đi xem phim cả nhà'
        },
        taskRewardConfig: {
            targetRate: 80,
            reward: 'một bữa tối ăn ngoài hoặc xem phim cùng nhau'
        },
        achievementRewardConfig: {
            targetScore: 10,
            targetCount: 2,
            reward: '100K tiết kiệm'
        },
    },
});

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    login: (email: string, pass: string) => Promise<User | null>;
    signInWithGoogle: () => Promise<User | null>;
    register: (email: string, pass: string) => Promise<FirebaseUser | null>;
    logout: () => void;
    sendPasswordResetEmail: (email: string) => Promise<void>;
    getUserData: () => Promise<UserData>;
    updateUserData: (data: Partial<UserData>) => Promise<void>;
    getAllUsers: () => Promise<User[]>;
    updateUser: (uid: string, data: { isActive?: boolean; expiryDate?: string | null; email?: string; subscriptionTier?: 'free' | 'pro' }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // --- DEV MODE LOGIC ---
    if (DEV_MODE) {
        const [mockUserData, setMockUserData] = useState<UserData | null>(null);
        const [devLoading, setDevLoading] = useState(true);

        useEffect(() => {
            // Simulate loading and initialize data from localStorage or defaults
            setTimeout(() => {
                try {
                    const storedData = localStorage.getItem('mockUserData');
                    if (storedData) {
                        setMockUserData(JSON.parse(storedData));
                    } else {
                        const defaultData = getDefaultUserData();
                        setMockUserData(defaultData);
                        localStorage.setItem('mockUserData', JSON.stringify(defaultData));
                    }
                } catch (e) {
                    console.error("Failed to parse mock user data from localStorage", e);
                    const defaultData = getDefaultUserData();
                    setMockUserData(defaultData);
                    localStorage.setItem('mockUserData', JSON.stringify(defaultData));
                }
                setDevLoading(false);
            }, 500); // simulate a short loading time
        }, []);

        const getUserData = async (): Promise<UserData> => {
            return Promise.resolve(mockUserData || getDefaultUserData());
        };

        const updateUserData = async (data: Partial<UserData>) => {
            const currentData = mockUserData || getDefaultUserData();
            // Perform a deep merge for nested objects to avoid overwriting entire sub-states
            const newData: UserData = {
                ...currentData,
                ...data,
                selfDevelopment: { ...currentData.selfDevelopment, ...data.selfDevelopment },
                lifeGoals: { ...currentData.lifeGoals, ...data.lifeGoals },
                financials: { ...currentData.financials, ...data.financials },
                happyFamily: data.happyFamily ? { ...(currentData.happyFamily || {}), ...data.happyFamily } : currentData.happyFamily,
            };
            setMockUserData(newData);
            localStorage.setItem('mockUserData', JSON.stringify(newData));
            return Promise.resolve();
        };

        const value: AuthContextType = {
            currentUser: MOCK_USER,
            loading: devLoading,
            login: async () => MOCK_USER,
            signInWithGoogle: async () => MOCK_USER,
            register: async () => null,
            logout: () => {
                if(window.confirm('Bạn có muốn xóa dữ liệu demo và tải lại không?')) {
                    localStorage.removeItem('mockUserData');
                    window.location.reload();
                }
            },
            sendPasswordResetEmail: async () => { alert('Password reset email sent (mock).'); },
            getUserData,
            updateUserData,
            getAllUsers: async () => [MOCK_USER],
            updateUser: async (uid, data) => { alert(`User ${uid} updated with ${JSON.stringify(data)} (mock)`); },
        };

        return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
    }

    // --- FIREBASE (ONLINE) LOGIC ---
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUserDocument = useCallback(async (firebaseUser: FirebaseUser): Promise<User> => {
        const userDocRef = db.collection('users').doc(firebaseUser.uid);
        const docSnap = await userDocRef.get();

        if (docSnap.exists) {
            const docData = docSnap.data() || {};
            // Self-healing: if email is missing in DB, update it from auth provider
            if (!docData.email && firebaseUser.email) {
                await userDocRef.update({ email: firebaseUser.email });
            }
            return {
                uid: firebaseUser.uid,
                ...docData,
                email: firebaseUser.email!,
            } as User;
        } else {
            // New user: Create user document and data subcollection in a single atomic batch
            if (!firebaseUser.email) {
                throw new Error("Không thể tạo tài khoản do nhà cung cấp không trả về email.");
            }

            const newUser: Omit<User, 'uid'> = {
                email: firebaseUser.email,
                role: 'user',
                isActive: true, // Auto-activate for ALL new sign-ups
                subscriptionTier: 'free', // Default to free tier
            };
            const defaultData = getDefaultUserData();

            const batch = db.batch();
            
            // 1. Set the main user document
            batch.set(userDocRef, newUser);

            // 2. Set the data subcollection document
            const dataDocRef = userDocRef.collection('data').doc('main');
            batch.set(dataDocRef, defaultData);
            
            // Commit both writes at once
            await batch.commit();

            return {
                uid: firebaseUser.uid,
                ...newUser,
            };
        }
    }, []);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const userProfile = await fetchUserDocument(firebaseUser);
                    setCurrentUser(userProfile);
                } catch (error) {
                    console.error("Error fetching/creating user document:", error);
                    await auth.signOut();
                    setCurrentUser(null);
                }
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
    
    const sendPasswordResetEmail = (email: string) => {
        return auth.sendPasswordResetEmail(email);
    };

    const logout = () => {
        return auth.signOut();
    };

    const getUserData = useCallback(async (): Promise<UserData> => {
        if (!currentUser) throw new Error("Not logged in");
        const dataDocRef = db.collection('users').doc(currentUser.uid).collection('data').doc('main');
        const docSnap = await dataDocRef.get();
        if (docSnap.exists) {
            return docSnap.data() as UserData;
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
        const usersCollection = db.collection('users');
        const snapshot = await usersCollection.get();
        return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
    };

    const updateUser = async (uid: string, data: { isActive?: boolean; expiryDate?: string | null; email?: string, subscriptionTier?: 'free' | 'pro' }) => {
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
        sendPasswordResetEmail,
        getUserData,
        updateUserData,
        getAllUsers,
        updateUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};