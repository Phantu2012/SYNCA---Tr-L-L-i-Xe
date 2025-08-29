import React from 'react';
import PageHeader from '../components/PageHeader';
import { Page } from '../types';

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
        <p className="font-medium text-gray-800 dark:text-gray-200">{value}</p>
    </div>
);

const Profile: React.FC<ProfileProps> = ({ setActivePage }) => {
    // Mock user data
    const user = {
        name: 'Nguyễn Văn An',
        phone: '0901 234 567',
        email: 'nguyen.van.an@example.com',
    };
    
    // Mock subscription data
    const subscription = {
        isPremium: true,
        expiryDate: '2025-07-31'
    };
    
    return (
        <div>
            <PageHeader title="Tài khoản của tôi" subtitle="Quản lý thông tin cá nhân và cài đặt tài khoản của bạn." />

            <div className="space-y-8 max-w-2xl">
                {/* Personal Information */}
                <InfoCard title="Thông tin cá nhân">
                    <InfoRow label="Họ và tên" value={user.name} />
                    <InfoRow label="Số điện thoại" value={user.phone} />
                    <InfoRow label="Email" value={user.email} />
                    <div className="pt-2">
                        <button className="text-sm text-blue-500 hover:underline">Chỉnh sửa thông tin</button>
                    </div>
                </InfoCard>

                {/* Subscription Information */}
                <InfoCard title="Thông tin gói cước">
                    {subscription.isPremium ? (
                        <InfoRow label="Trạng thái" value={`Thành viên Premium (hết hạn ${subscription.expiryDate})`} />
                    ) : (
                        <InfoRow label="Trạng thái" value="Bạn đang dùng gói Miễn phí" />
                    )}
                     <button className="px-4 py-2 mt-2 bg-yellow-500 text-gray-900 font-semibold rounded-md hover:bg-yellow-400 transition-colors">
                        {subscription.isPremium ? 'Quản lý gói cước' : 'Nâng cấp Premium'}
                    </button>
                </InfoCard>

                {/* Other Actions */}
                <InfoCard title="Cài đặt & Thao tác">
                    <button onClick={() => setActivePage(Page.SETTINGS)} className="w-full text-left p-3 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        Cài đặt thông báo
                    </button>
                     <button onClick={() => alert('Chức năng đổi mật khẩu đang được phát triển.')} className="w-full text-left p-3 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        Đổi mật khẩu
                    </button>
                     <button onClick={() => alert('Bạn đã đăng xuất thành công!')} className="w-full text-left p-3 rounded-md text-red-500 hover:bg-red-500/10 transition-colors">
                        Đăng xuất
                    </button>
                </InfoCard>
            </div>
        </div>
    );
};

export default Profile;
