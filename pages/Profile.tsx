import React from 'react';
import PageHeader from '../components/PageHeader';
import { Page } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface ProfileProps {
    setActivePage: (page: Page) => void;
}

// Simple card component for styling consistency
const InfoCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">{title}</h3>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex justify-between items-center">
        <p className="text-gray-500 dark:text-gray-400">{label}</p>
        <p className="font-medium text-gray-800 dark:text-gray-200 break-all">{value}</p>
    </div>
);

const Profile: React.FC<ProfileProps> = ({ setActivePage }) => {
    const { currentUser, logout } = useAuth();
    
    // Mock subscription data
    const subscription = {
        isPremium: true,
        expiryDate: '2025-07-31'
    };
    
    if (!currentUser) {
        return <div>Đang tải thông tin người dùng...</div>;
    }

    return (
        <div>
            <PageHeader title="Tài khoản của tôi" subtitle="Quản lý thông tin cá nhân và cài đặt tài khoản của bạn." />

            <div className="space-y-8 max-w-2xl">
                {/* Personal Information */}
                <InfoCard title="Thông tin tài khoản">
                    <InfoRow label="Email" value={currentUser.email} />
                    <InfoRow label="Vai trò" value={currentUser.role === 'admin' ? 'Quản trị viên' : 'Người dùng'} />
                    <div className="pt-2">
                        <button className="text-sm text-blue-500 hover:underline">Chỉnh sửa thông tin (sắp có)</button>
                    </div>
                </InfoCard>

                {/* Subscription Information */}
                <InfoCard title="Thông tin gói cước">
                    {subscription.isPremium ? (
                        <InfoRow label="Trạng thái" value={`Thành viên Premium (hết hạn ${subscription.expiryDate})`} />
                    ) : (
                        <InfoRow label="Trạng thái" value="Bạn đang dùng gói Miễn phí" />
                    )}
                     {/* Fix: Complete the button element which was truncated */}
                     <button className="px-4 py-2 mt-2 bg-yellow-500 text-gray-900 font-semibold rounded-md hover:bg-yellow-600 transition-colors">Nâng cấp gói (sắp có)</button>
                </InfoCard>

                 {/* Danger Zone */}
                <InfoCard title="Khu vực nguy hiểm">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="font-medium text-gray-800 dark:text-gray-200">Đăng xuất</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Đăng xuất khỏi tài khoản của bạn.</p>
                        </div>
                        <button
                            onClick={logout}
                            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors"
                        >
                            Đăng xuất
                        </button>
                    </div>
                </InfoCard>
            </div>
        </div>
    );
};

// Fix: Add missing default export
export default Profile;