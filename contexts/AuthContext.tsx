import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { User, UserData, DocumentType, ReminderType, EventGroup, ExpenseCategory, IncomeCategory, TransactionType, AssetCategory, DebtCategory, InvestmentCategory, GoalCategory, HappyFamilyData } from '../types';
import { auth, db, firebase } from '../services/firebase';

type FirebaseUser = firebase.User;

// --- CHẾ ĐỘ NHÀ PHÁT TRIỂN (DEV MODE) ---
// Đặt thành `true` để bỏ qua màn hình đăng nhập và sử dụng dữ liệu giả (offline).
// Dữ liệu sẽ được lưu vào localStorage để mô phỏng tính bền vững.
// Đặt thành `false` để kết nối với Firebase (online).
const DEV_MODE = false;

// Dữ liệu người dùng giả cho DEV_MODE
const MOCK_USER_INITIAL: User = {
  uid: 'dev-user-01',
  email: 'dev@synca.app',
  displayName: 'Synca User',
  photoURL: '',
  role: 'admin',
  isActive: true,
  familyId: 'dev-family-01',
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
    vehicles: [
        { id: 'v1', name: 'Vinfast VF8', plateNumber: '51K-888.88' }
    ],
    vehicleLog: [
        { id: '1', vehicleId: 'v1', date: '2024-06-15', mileage: 15000, service: 'Thay dầu, lọc dầu', cost: 1200000, notes: 'Dầu Mobil 1', nextMileage: 20000, nextMaintenanceNotes: 'Kiểm tra lại hệ thống phanh và nước làm mát.' },
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
        ideas: [],
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
             { id: 'task1', title: 'Dọn dẹp phòng khách', assigneeId: 'm2', deadline: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().slice(0, 16), priority: 'medium', status: 'pending', steps: [{id: 's1', text: 'Lau bụi', isCompleted: false}, {id: 's2', text: 'Hút bụi sàn', isCompleted: false}] },
             { id: 'task2', title: 'Đi siêu thị mua đồ ăn tuần', assigneeId: 'm1', deadline: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().slice(0, 16), priority: 'high', status: 'overdue', steps: [] },
             { id: 'task3', title: 'Hoàn thành bài tập toán', assigneeId: 'm3', deadline: new Date().toISOString().slice(0, 16), priority: 'high', status: 'completed', steps: [] },
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
    getUserData: () => Promise<Omit<UserData, 'happyFamily'>>;
    updateUserData: (data: Partial<Omit<UserData, 'happyFamily'>>) => Promise<void>;
    getFamilyData: () => Promise<HappyFamilyData>;
    updateFamilyData: (data: Partial<HappyFamilyData>) => Promise<void>;
    acceptInvitation: (invitationId: string, familyId: string) => Promise<void>;
    getAllUsers: () => Promise<User[]>;
    updateUser: (uid: string, data: { isActive?: boolean; expiryDate?: string | null; email?: string; subscriptionTier?: 'free' | 'pro' }) => Promise<void>;
    updateUserProfile: (profile: { displayName?: string; }) => Promise<void>;
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
        const [mockUser, setMockUser] = useState<User>(MOCK_USER_INITIAL);
        const [mockUserData, setMockUserData] = useState<UserData | null>(null);
        const [mockFamilyData, setMockFamilyData] = useState<HappyFamilyData | null>(null);
        const [devLoading, setDevLoading] = useState(true);

        useEffect(() => {
            setTimeout(() => {
                try {
                    const storedUserData = localStorage.getItem('mockUserData');
                    const storedFamilyData = localStorage.getItem('mockFamilyData');
                    
                    if (storedUserData) setMockUserData(JSON.parse(storedUserData));
                    else {
                        const { happyFamily, ...userSpecificData } = getDefaultUserData();
                        setMockUserData(userSpecificData);
                        localStorage.setItem('mockUserData', JSON.stringify(userSpecificData));
                    }

                    if (storedFamilyData) setMockFamilyData(JSON.parse(storedFamilyData));
                    else {
                        const defaultFamilyData = getDefaultUserData().happyFamily!;
                        setMockFamilyData(defaultFamilyData);
                        localStorage.setItem('mockFamilyData', JSON.stringify(defaultFamilyData));
                    }
                } catch (e) {
                    console.error("Failed to parse mock data from localStorage", e);
                    const { happyFamily, ...userSpecificData } = getDefaultUserData();
                    setMockUserData(userSpecificData);
                    setMockFamilyData(happyFamily!);
                    localStorage.setItem('mockUserData', JSON.stringify(userSpecificData));
                    localStorage.setItem('mockFamilyData', JSON.stringify(happyFamily!));
                }
                setDevLoading(false);
            }, 500);
        }, []);
        
         const updateUserProfile = async ({ displayName }: { displayName?: string; }) => {
            const updatedProfile: Partial<User> = {};

            if (displayName !== undefined) {
                updatedProfile.displayName = displayName;
            }
            
            setMockUser(prev => ({ ...prev, ...updatedProfile }));
            alert('Hồ sơ đã được cập nhật (chế độ demo).');
        };

        const value: AuthContextType = {
            currentUser: mockUser,
            loading: devLoading,
            login: async () => mockUser,
            signInWithGoogle: async () => mockUser,
            register: async () => null,
            logout: () => {
                if(window.confirm('Bạn có muốn xóa dữ liệu demo và tải lại không?')) {
                    localStorage.removeItem('mockUserData');
                    localStorage.removeItem('mockFamilyData');
                    window.location.reload();
                }
            },
            sendPasswordResetEmail: async () => { alert('Password reset email sent (mock).'); },
            getUserData: async () => {
                const { happyFamily, ...rest } = (mockUserData || getDefaultUserData());
                return rest;
            },
            updateUserData: async (data) => {
                const newData = { ...(mockUserData || {}), ...data } as UserData;
                setMockUserData(newData);
                localStorage.setItem('mockUserData', JSON.stringify(newData));
            },
            getFamilyData: async () => Promise.resolve(mockFamilyData || getDefaultUserData().happyFamily!),
            updateFamilyData: async (data) => {
                const newData = { ...(mockFamilyData || {}), ...data } as HappyFamilyData;
                setMockFamilyData(newData);
                localStorage.setItem('mockFamilyData', JSON.stringify(newData));
            },
            acceptInvitation: async () => alert('Invitation accepted (mock).'),
            getAllUsers: async () => [mockUser],
            updateUser: async (uid, data) => alert(`User ${uid} updated with ${JSON.stringify(data)} (mock)`),
            updateUserProfile,
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

            // MIGRATION: Handle existing users without a familyId
            if (!docData.familyId) {
                console.log(`User ${firebaseUser.uid} is missing familyId. Migrating now.`);
                const batch = db.batch();
                const newFamilyRef = db.collection('families').doc();
                
                // Check if user has old happyFamily data to migrate
                const dataDocRef = db.collection('users').doc(firebaseUser.uid).collection('data').doc('main');
                const dataSnap = await dataDocRef.get();
                let familyDataToSet = getDefaultUserData().happyFamily!;
                
                if (dataSnap.exists) {
                    const oldUserData = dataSnap.data();
                    if (oldUserData && oldUserData.happyFamily) {
                        console.log(`Found old happyFamily data for user ${firebaseUser.uid}. Migrating it.`);
                        familyDataToSet = oldUserData.happyFamily;
                        // Remove the old data from the user's document
                        batch.update(dataDocRef, { happyFamily: firebase.firestore.FieldValue.delete() });
                    }
                }

                // 1. Create the new family document
                batch.set(newFamilyRef, familyDataToSet);

                // 2. Update the user document with the new familyId
                batch.update(userDocRef, { familyId: newFamilyRef.id });

                await batch.commit();
                docData.familyId = newFamilyRef.id; // Update local data to reflect change
            }
            
            if (!docData.email && firebaseUser.email) {
                await userDocRef.update({ email: firebaseUser.email });
            }

            return {
                uid: firebaseUser.uid,
                ...docData,
                email: firebaseUser.email!,
            } as User;

        } else {
            // New user creation logic
            if (!firebaseUser.email) {
                throw new Error("Không thể tạo tài khoản do nhà cung cấp không trả về email.");
            }

            const batch = db.batch();
            
            // 1. Create a new family document
            const newFamilyRef = db.collection('families').doc();
            const defaultData = getDefaultUserData();
            const defaultHappyFamilyData = defaultData.happyFamily || {};
            batch.set(newFamilyRef, defaultHappyFamilyData);

            // 2. Create the new user document with the familyId
            const newUser: Omit<User, 'uid'> = {
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                photoURL: firebaseUser.photoURL || '',
                role: 'user',
                isActive: true,
                subscriptionTier: 'free',
                familyId: newFamilyRef.id,
            };
            batch.set(userDocRef, newUser);

            // 3. Set the user-specific data subcollection (everything EXCEPT happyFamily)
            const { happyFamily, ...userSpecificData } = defaultData;
            const dataDocRef = userDocRef.collection('data').doc('main');
            batch.set(dataDocRef, userSpecificData);
            
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
        if (firebaseUser) return await fetchUserDocument(firebaseUser);
        return null;
    };

    const signInWithGoogle = async (): Promise<User | null> => {
        const provider = new firebase.auth.GoogleAuthProvider();
        const { user: firebaseUser } = await auth.signInWithPopup(provider);
        if (firebaseUser) return await fetchUserDocument(firebaseUser);
        return null;
    };

    const register = async (email: string, pass: string): Promise<FirebaseUser | null> => {
        const { user: firebaseUser } = await auth.createUserWithEmailAndPassword(email, pass);
        if (firebaseUser) await fetchUserDocument(firebaseUser);
        return firebaseUser;
    };
    
    const sendPasswordResetEmail = (email: string) => auth.sendPasswordResetEmail(email);
    const logout = () => auth.signOut();

    const updateUserProfile = async ({ displayName }: { displayName?: string; }) => {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) throw new Error("Not authenticated");

        const authUpdateData: { displayName?: string } = {};
        const firestoreUpdateData: { displayName?: string } = {};

        if (displayName !== undefined && displayName !== currentUser?.displayName) {
            authUpdateData.displayName = displayName;
            firestoreUpdateData.displayName = displayName;
        }

        const hasUpdates = Object.keys(firestoreUpdateData).length > 0;
        if (hasUpdates) {
            await firebaseUser.updateProfile(authUpdateData);
            await db.collection('users').doc(firebaseUser.uid).update(firestoreUpdateData);
            setCurrentUser(prev => prev ? { ...prev, ...firestoreUpdateData } : null);
        }
    };


    const getUserData = useCallback(async (): Promise<Omit<UserData, 'happyFamily'>> => {
        if (!currentUser) throw new Error("Not logged in");
        const dataDocRef = db.collection('users').doc(currentUser.uid).collection('data').doc('main');
        const docSnap = await dataDocRef.get();
        if (docSnap.exists) return docSnap.data() as Omit<UserData, 'happyFamily'>;
        const { happyFamily, ...userSpecificData } = getDefaultUserData();
        await dataDocRef.set(userSpecificData);
        return userSpecificData;
    }, [currentUser]);

    const updateUserData = useCallback(async (data: Partial<Omit<UserData, 'happyFamily'>>) => {
        if (!currentUser) throw new Error("Not logged in");
        const dataDocRef = db.collection('users').doc(currentUser.uid).collection('data').doc('main');
        await dataDocRef.set(data, { merge: true });
    }, [currentUser]);

    const getFamilyData = useCallback(async (): Promise<HappyFamilyData> => {
        if (!currentUser?.familyId) {
            throw new Error("User does not have a family ID. Please re-login to fix.");
        }
        const familyDocRef = db.collection('families').doc(currentUser.familyId);
        const docSnap = await familyDocRef.get();
        const defaultFamilyData = getDefaultUserData().happyFamily!;

        if (docSnap.exists) {
            const dataFromDb = docSnap.data() as HappyFamilyData;
            // FIX: Đảm bảo các trường thiết yếu như defaultChecklistItems luôn tồn tại.
            const mergedData = {
                ...defaultFamilyData,
                ...dataFromDb,
            };

            // Củng cố logic: Nếu danh sách mẫu trong DB bị trống hoặc thiếu,
            // luôn luôn sử dụng danh sách mặc định từ code để tránh bị mất.
            if (!mergedData.defaultChecklistItems || mergedData.defaultChecklistItems.length === 0) {
                mergedData.defaultChecklistItems = defaultFamilyData.defaultChecklistItems;
            }

            return mergedData;
        }
        
        // Trường hợp này xử lý nếu tài liệu gia đình bị xóa bằng cách nào đó.
        await familyDocRef.set(defaultFamilyData);
        return defaultFamilyData;
    }, [currentUser]);

    const updateFamilyData = useCallback(async (data: Partial<HappyFamilyData>) => {
        if (!currentUser?.familyId) throw new Error("User has no familyId");
        const familyDocRef = db.collection('families').doc(currentUser.familyId);
        await familyDocRef.set(data, { merge: true });
    }, [currentUser]);

    const acceptInvitation = useCallback(async (invitationId: string, familyId: string) => {
        if (!currentUser) throw new Error("Not logged in");

        const batch = db.batch();
        // 1. Update user's familyId
        const userRef = db.collection('users').doc(currentUser.uid);
        batch.update(userRef, { familyId });

        // 2. Add user to the new family's member list
        const familyRef = db.collection('families').doc(familyId);
        const newMember = { id: currentUser.uid, name: currentUser.displayName || currentUser.email.split('@')[0], uid: currentUser.uid };
        batch.update(familyRef, { members: firebase.firestore.FieldValue.arrayUnion(newMember) });

        // 3. Mark invitation as accepted
        const invitationRef = db.collection('invitations').doc(invitationId);
        batch.update(invitationRef, { status: 'accepted' });

        await batch.commit();

        // Force a state refresh by refetching user data
        const updatedUser = await fetchUserDocument(auth.currentUser!);
        setCurrentUser(updatedUser);
    }, [currentUser, fetchUserDocument]);

    const getAllUsers = async (): Promise<User[]> => {
        const snapshot = await db.collection('users').get();
        return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
    };

    const updateUser = async (uid: string, data: { isActive?: boolean; expiryDate?: string | null; email?: string, subscriptionTier?: 'free' | 'pro' }) => {
        await db.collection('users').doc(uid).update(data);
    };

    const value: AuthContextType = {
        currentUser, loading, login, signInWithGoogle, register, logout, sendPasswordResetEmail,
        getUserData, updateUserData, getFamilyData, updateFamilyData, acceptInvitation, getAllUsers, updateUser,
        updateUserProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};