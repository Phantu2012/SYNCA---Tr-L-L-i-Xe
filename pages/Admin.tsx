import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';
import { db } from '../services/firebase';

const FirestoreRuleGuide: React.FC = () => {
    const rule = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ... các rule khác của bạn

    // THÊM RULE NÀY ĐỂ CHO PHÉP ADMIN ĐỌC DANH SÁCH NGƯỜI DÙNG
    match /users/{userId} {
      // Admin có thể đọc và cập nhật tất cả tài liệu người dùng.
      allow read, update: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';

      // Người dùng có thể đọc và cập nhật thông tin của chính họ.
      allow read, update: if request.auth.uid == userId;
    }
  }
}
    `.trim();
    return (
        <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-200 px-4 py-3 rounded-lg m-4">
            <h4 className="font-bold text-yellow-300">Lỗi Phân quyền - Không thể tải danh sách người dùng</h4>
            <p className="mt-2 text-sm">
                Tài khoản của bạn không có quyền đọc danh sách người dùng từ cơ sở dữ liệu. Đây là một lỗi cấu hình bảo mật phía máy chủ (Firestore Security Rules), không phải lỗi của ứng dụng.
            </p>
            <p className="mt-2 text-sm">
                Để khắc phục, vui lòng truy cập vào trang quản lý Firebase project của bạn, vào mục <strong>Firestore Database &gt; Rules</strong> và cập nhật rules của bạn để cho phép quản trị viên đọc collection <code>users</code>.
            </p>
            <p className="mt-2 text-sm font-semibold">Ví dụ về Rule cần thiết:</p>
            <pre className="mt-2 bg-gray-900 text-white p-3 rounded-md text-xs overflow-x-auto">
                <code>{rule}</code>
            </pre>
        </div>
    );
};


const Admin: React.FC = () => {
    const { updateUser, currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [usersError, setUsersError] = useState<string | null>(null);
    const [expiryDates, setExpiryDates] = useState<Record<string, string>>({});

    // --- State for daily quote management ---
    const [quote, setQuote] = useState('');
    const [author, setAuthor] = useState('');
    const [analysis, setAnalysis] = useState('');
    const [isSavingQuote, setIsSavingQuote] = useState(false);
    const [quoteStatus, setQuoteStatus] = useState('');

    useEffect(() => {
        const unsubscribe = db.collection('users').onSnapshot(snapshot => {
            setUsersError(null);
            const userList = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
            setUsers(userList);
            setLoading(false);
        }, error => {
            console.error("Failed to fetch users with snapshot listener:", error);
            if (error.code === 'permission-denied' || error.message.includes('permission')) {
                setUsersError('permission-denied');
            } else {
                setUsersError('generic-error');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const fetchQuote = useCallback(async () => {
        try {
            const docRef = db.collection('appConfig').doc('dailyMessage');
            const docSnap = await docRef.get();
            if (docSnap.exists) {
                const data = docSnap.data();
                setQuote(data?.quote || '');
                setAuthor(data?.author || '');
                setAnalysis(data?.analysis || '');
            }
        } catch (error) {
            console.error("Failed to fetch daily quote for admin panel", error);
        }
    }, []);

    useEffect(() => {
        fetchQuote();
    }, [fetchQuote]);

    const handleToggleActivation = async (userToUpdate: User) => {
        await updateUser(userToUpdate.uid, { isActive: !userToUpdate.isActive });
    };

    const handleDateChange = (uid: string, date: string) => {
        setExpiryDates(prev => ({ ...prev, [uid]: date }));
    };

    const handleSaveDate = async (uid: string) => {
        const newDate = expiryDates[uid];
        if (newDate === undefined) return;
        await updateUser(uid, { expiryDate: newDate });
    };

    const handleClearDate = async (uid: string) => {
        await updateUser(uid, { expiryDate: null });
        setExpiryDates(prev => {
            const updated = { ...prev };
            delete updated[uid];
            return updated;
        });
    };
    
    const handleChangeSubscription = async (userToUpdate: User, newTier: 'pro' | 'free') => {
        if (newTier === 'pro') {
            const expiry = new Date();
            expiry.setFullYear(expiry.getFullYear() + 1);
            await updateUser(userToUpdate.uid, {
                subscriptionTier: 'pro',
                expiryDate: expiry.toISOString().split('T')[0]
            });
        } else {
            await updateUser(userToUpdate.uid, {
                subscriptionTier: 'free',
                expiryDate: null
            });
        }
    };

    const handleSaveQuote = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingQuote(true);
        setQuoteStatus('');
        try {
            const docRef = db.collection('appConfig').doc('dailyMessage');
            await docRef.set({ quote, author, analysis }, { merge: true });
            setQuoteStatus('Lưu thông điệp thành công!');
            setTimeout(() => setQuoteStatus(''), 3000);
        } catch (error) {
            console.error("Error saving daily quote:", error);
            setQuoteStatus('Lưu thất bại. Vui lòng thử lại.');
             setTimeout(() => setQuoteStatus(''), 3000);
        } finally {
            setIsSavingQuote(false);
        }
    };
    
    if (loading && users.length === 0) {
        return (
             <div>
                <PageHeader title="Quản trị" subtitle="Quản lý các tài khoản người dùng và nội dung ứng dụng." />
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <PageHeader title="Quản trị" subtitle="Quản lý các tài khoản người dùng và nội dung ứng dụng." />

             {/* Daily Message Management Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Thông điệp Hàng ngày</h3>
                <form onSubmit={handleSaveQuote} className="space-y-4">
                    <div>
                        <label htmlFor="quote" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Câu nói</label>
                        <textarea id="quote" value={quote} onChange={e => setQuote(e.target.value)} rows={3} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                     <div>
                        <label htmlFor="author" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tác giả</label>
                        <input type="text" id="author" value={author} onChange={e => setAuthor(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                     <div>
                        <label htmlFor="analysis" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phân tích</label>
                        <textarea id="analysis" value={analysis} onChange={e => setAnalysis(e.target.value)} rows={4} className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                     <div className="flex items-center justify-end gap-4">
                        {quoteStatus && <p className={`text-sm ${quoteStatus.includes('thành công') ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>{quoteStatus}</p>}
                        <button type="submit" disabled={isSavingQuote} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed">
                            {isSavingQuote ? 'Đang lưu...' : 'Lưu Thông điệp'}
                        </button>
                    </div>
                </form>
            </div>

            {/* User Management Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">Quản lý Người dùng</h3>
                {usersError === 'permission-denied' && <FirestoreRuleGuide />}
                {usersError === 'generic-error' && <p className="p-4 text-red-500 dark:text-red-400">Đã xảy ra lỗi không xác định khi tải danh sách người dùng.</p>}
                
                {!usersError && (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-max text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="p-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                                    <th className="p-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vai trò</th>
                                    <th className="p-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trạng thái</th>
                                    <th className="p-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gói cước</th>
                                    <th className="p-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ngày hết hạn</th>
                                    <th className="p-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {users.map((user) => (
                                    <tr key={user.uid} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="p-4 font-medium text-gray-900 dark:text-white break-all">{user.email}</td>
                                        <td className="p-4 capitalize text-gray-600 dark:text-gray-300">{user.role}</td>
                                        <td className="p-4">
                                            {user.isActive ? (
                                                <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 dark:text-green-100 dark:bg-green-600/50 rounded-full">
                                                    Đang hoạt động
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 dark:text-yellow-100 dark:bg-yellow-600/50 rounded-full">
                                                    Chưa/Ngừng kích hoạt
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 capitalize">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.subscriptionTier === 'pro' ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200'}`}>
                                                {user.subscriptionTier || 'free'}
                                                </span>
                                                {user.subscriptionTier === 'pro' ? (
                                                    <button onClick={() => handleChangeSubscription(user, 'free')} className="text-xs text-gray-500 dark:text-gray-400 hover:underline" disabled={user.role === 'admin'}>Hạ cấp</button>
                                                ) : (
                                                    <button onClick={() => handleChangeSubscription(user, 'pro')} className="text-xs text-blue-500 dark:text-blue-400 hover:underline" disabled={user.role === 'admin'}>Nâng cấp</button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="date"
                                                    value={expiryDates[user.uid] ?? user.expiryDate ?? ''}
                                                    onChange={(e) => handleDateChange(user.uid, e.target.value)}
                                                    className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-md p-2 w-40"
                                                    disabled={user.role === 'admin'}
                                                />
                                                <button
                                                    onClick={() => handleSaveDate(user.uid)}
                                                    className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white text-xs font-semibold rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50"
                                                    disabled={expiryDates[user.uid] === undefined || user.role === 'admin'}
                                                >
                                                    Lưu
                                                </button>
                                                <button
                                                    onClick={() => handleClearDate(user.uid)}
                                                    className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white text-xs font-semibold rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50"
                                                    disabled={!user.expiryDate || user.role === 'admin'}
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => handleToggleActivation(user)}
                                                disabled={user.uid === currentUser?.uid}
                                                className={`px-3 py-1 text-white text-sm font-semibold rounded-md shadow-sm transition-colors w-28
                                                    ${user.isActive ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'}
                                                    ${user.uid === currentUser?.uid ? 'opacity-50 cursor-not-allowed' : ''}
                                                `}
                                            >
                                                {user.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {users.length === 0 && !loading && !usersError && (
                            <p className="p-4 text-center text-gray-500 dark:text-gray-400">Không tìm thấy người dùng nào.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Admin;