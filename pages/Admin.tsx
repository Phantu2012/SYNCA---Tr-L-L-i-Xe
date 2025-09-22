import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';

const Admin: React.FC = () => {
    const { getAllUsers, activateUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        const userList = await getAllUsers();
        setUsers(userList);
        setLoading(false);
    }, [getAllUsers]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleActivate = async (uid: string) => {
        await activateUser(uid);
        // Refresh the list to show the change
        fetchUsers(); 
    };
    
    if (loading) {
        return (
             <div>
                <PageHeader title="Quản trị Người dùng" subtitle="Kích hoạt và quản lý các tài khoản người dùng trong hệ thống." />
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <PageHeader title="Quản trị Người dùng" subtitle="Kích hoạt và quản lý các tài khoản người dùng trong hệ thống." />

            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
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