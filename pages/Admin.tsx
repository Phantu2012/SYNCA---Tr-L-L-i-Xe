import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';
import { db } from '../services/firebase';

const Admin: React.FC = () => {
    const { getAllUsers, activateUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // --- State for daily quote management ---
    const [quote, setQuote] = useState('');
    const [author, setAuthor] = useState('');
    const [analysis, setAnalysis] = useState('');
    const [isSavingQuote, setIsSavingQuote] = useState(false);
    const [quoteStatus, setQuoteStatus] = useState('');


    const fetchUsers = useCallback(async () => {
        // We set loading to false only after all data is fetched
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

    const handleActivate = async (uid: string) => {
        await activateUser(uid);
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
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <h3 className="text-xl font-semibold text-white p-4 bg-gray-700 border-b border-gray-600">Quản lý Người dùng</h3>
                <table className="w-full text-left">
                    <thead className="bg-gray-700">
                        <tr>
                            <th className="p-4 font-semibold">Email</th>
                            <th className="p-4 font-semibold">Vai trò</th>
                            <th className="p-4 font-semibold">Trạng thái</th>
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
                                            Đã kích hoạt
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 text-xs font-semibold text-yellow-100 bg-yellow-600/50 rounded-full">
                                            Chờ kích hoạt
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 text-center">
                                    {!user.isActive && user.role !== 'admin' && (
                                        <button
                                            onClick={() => handleActivate(user.uid)}
                                            className="px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-blue-700 transition-colors"
                                        >
                                            Kích hoạt
                                        </button>
                                    )}
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
