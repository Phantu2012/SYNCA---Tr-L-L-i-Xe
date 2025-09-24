/** @jsxRuntime classic */
import React, { useState, useEffect, useCallback } from 'https://esm.sh/react@18.2.0';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';
import { db } from '../services/firebase';

const Admin: React.FC = () => {
    const { getAllUsers, updateUser, currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [expiryDates, setExpiryDates] = useState<Record<string, string>>({});

    // --- State for daily quote management ---
    const [quote, setQuote] = useState('');
    const [author, setAuthor] = useState('');
    const [analysis, setAnalysis] = useState('');
    const [isSavingQuote, setIsSavingQuote] = useState(false);
    const [quoteStatus, setQuoteStatus] = useState('');


    const fetchUsers = useCallback(async () => {
        const userList = await getAllUsers();
        setUsers(userList);
    }, [getAllUsers]);

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
        const loadAllData = async () => {
            setLoading(true);
            await Promise.all([
                fetchUsers(),
                fetchQuote()
            ]);
            setLoading(false);
        };
        loadAllData();
    }, [fetchUsers, fetchQuote]);

    const handleToggleActivation = async (userToUpdate: User) => {
        await updateUser(userToUpdate.uid, { isActive: !userToUpdate.isActive });
        fetchUsers();
    };

    const handleDateChange = (uid: string, date: string) => {
        setExpiryDates(prev => ({ ...prev, [uid]: date }));
    };

    const handleSaveDate = async (uid: string) => {
        const newDate = expiryDates[uid];
        if (newDate === undefined) return;
        await updateUser(uid, { expiryDate: newDate });
        fetchUsers();
    };

    const handleClearDate = async (uid: string) => {
        await updateUser(uid, { expiryDate: null });
        setExpiryDates(prev => {
            const updated = { ...prev };
            delete updated[uid];
            return updated;
        });
        fetchUsers();
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
    
    if (loading) {
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
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
                <h3 className="text-xl font-semibold text-white mb-4">Thông điệp Hàng ngày</h3>
                <form onSubmit={handleSaveQuote} className="space-y-4">
                    <div>
                        <label htmlFor="quote" className="block text-sm font-medium text-gray-300 mb-1">Câu nói</label>
                        <textarea id="quote" value={quote} onChange={e => setQuote(e.target.value)} rows={3} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                     <div>
                        <label htmlFor="author" className="block text-sm font-medium text-gray-300 mb-1">Tác giả</label>
                        <input type="text" id="author" value={author} onChange={e => setAuthor(e.target.value)} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                     <div>
                        <label htmlFor="analysis" className="block text-sm font-medium text-gray-300 mb-1">Phân tích</label>
                        <textarea id="analysis" value={analysis} onChange={e => setAnalysis(e.target.value)} rows={4} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" required />
                    </div>
                     <div className="flex items-center justify-end gap-4">
                        {quoteStatus && <p className={`text-sm ${quoteStatus.includes('thành công') ? 'text-green-400' : 'text-red-400'}`}>{quoteStatus}</p>}
                        <button type="submit" disabled={isSavingQuote} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed">
                            {isSavingQuote ? 'Đang lưu...' : 'Lưu Thông điệp'}
                        </button>
                    </div>
                </form>
            </div>

            {/* User Management Section */}
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-x-auto">
                <h3 className="text-xl font-semibold text-white p-4 bg-gray-700 border-b border-gray-600">Quản lý Người dùng</h3>
                <table className="w-full min-w-max text-left">
                    <thead className="bg-gray-700">
                        <tr>
                            <th className="p-4 font-semibold">Email</th>
                            <th className="p-4 font-semibold">Vai trò</th>
                            <th className="p-4 font-semibold">Trạng thái</th>
                            <th className="p-4 font-semibold">Ngày hết hạn</th>
                            <th className="p-4 font-semibold text-center">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.uid} className="border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="p-4 font-medium break-all">{user.email}</td>
                                <td className="p-4 capitalize">{user.role}</td>
                                <td className="p-4">
                                    {user.isActive ? (
                                        <span className="px-2 py-1 text-xs font-semibold text-green-100 bg-green-600/50 rounded-full">
                                            Đang hoạt động
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 text-xs font-semibold text-yellow-100 bg-yellow-600/50 rounded-full">
                                            Chưa/Ngừng kích hoạt
                                        </span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="date"
                                            value={expiryDates[user.uid] ?? user.expiryDate ?? ''}
                                            onChange={(e) => handleDateChange(user.uid, e.target.value)}
                                            className="bg-gray-900 border-gray-600 text-white text-sm rounded-md p-2 w-40"
                                            disabled={user.role === 'admin'}
                                        />
                                        <button
                                            onClick={() => handleSaveDate(user.uid)}
                                            className="px-3 py-1 bg-gray-600 text-white text-xs font-semibold rounded-md hover:bg-gray-500 disabled:opacity-50"
                                            disabled={expiryDates[user.uid] === undefined || user.role === 'admin'}
                                        >
                                            Lưu
                                        </button>
                                         <button
                                            onClick={() => handleClearDate(user.uid)}
                                            className="px-3 py-1 bg-gray-600 text-white text-xs font-semibold rounded-md hover:bg-gray-500 disabled:opacity-50"
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
            </div>
        </div>
    );
};

export default Admin;