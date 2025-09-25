import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { Page, User } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface ProfileProps {
    setActivePage: (page: Page) => void;
}

const InfoCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">{title}</h3>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const InfoRow: React.FC<{ label: string; value: string | React.ReactNode }> = ({ label, value }) => (
    <div className="flex justify-between items-center">
        <p className="text-gray-500 dark:text-gray-400">{label}</p>
        <div className="font-medium text-gray-800 dark:text-gray-200 break-all text-right">{value}</div>
    </div>
);

const PublicProfileEditor: React.FC<{ user: User }> = ({ user }) => {
    const { updateUserProfile } = useAuth();
    const [displayName, setDisplayName] = useState(user.displayName || '');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsSaving(true);
        try {
            await updateUserProfile({ displayName });
            setSuccess('Cập nhật hồ sơ thành công!');
        } catch (err) {
            setError('Cập nhật thất bại. Vui lòng thử lại.');
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-400 mb-1">Bí danh</label>
                <input
                    type="text"
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tên bạn muốn hiển thị"
                />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            {success && <p className="text-sm text-green-400">{success}</p>}
            <div className="text-right">
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed">
                    {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
            </div>
        </form>
    );
}

const Profile: React.FC<ProfileProps> = ({ setActivePage }) => {
    const { currentUser, logout } = useAuth();
    
    if (!currentUser) {
        return <div>Đang tải thông tin người dùng...</div>;
    }
    
    const isProUser = currentUser.subscriptionTier === 'pro' && currentUser.expiryDate && new Date(currentUser.expiryDate) > new Date();

    const handleUpgradeClick = () => {
        alert("Tính năng thanh toán đang được phát triển. Vui lòng liên hệ quản trị viên để được nâng cấp thủ công. Xin cảm ơn!");
    };

    return (
        <div>
            <PageHeader title="Tài khoản của tôi" subtitle="Quản lý thông tin cá nhân và cài đặt tài khoản của bạn." />

            <div className="space-y-8 max-w-2xl">
                {/* Public Profile */}
                <InfoCard title="Hồ sơ công khai">
                    <p className="text-sm text-gray-400 -mt-2">Thông tin này sẽ hiển thị khi bạn tương tác trong mục Cộng đồng.</p>
                    <PublicProfileEditor user={currentUser} />
                </InfoCard>

                {/* Account Information */}
                <InfoCard title="Thông tin tài khoản">
                    <InfoRow label="Email" value={currentUser.email} />
                    <InfoRow label="Vai trò" value={currentUser.role === 'admin' ? 'Quản trị viên' : 'Người dùng'} />
                </InfoCard>

                {/* Subscription Information */}
                <InfoCard title="Thông tin gói cước">
                    <InfoRow 
                        label="Trạng thái" 
                        value={
                            isProUser ? (
                                <span className="font-semibold text-yellow-400">Thành viên PRO</span>
                            ) : (
                                "Bạn đang dùng gói Miễn phí"
                            )
                        } 
                    />
                    {isProUser && currentUser.expiryDate && (
                         <InfoRow label="Hết hạn ngày" value={new Date(currentUser.expiryDate).toLocaleDateString('vi-VN')} />
                    )}

                    {!isProUser && (
                        <div className="mt-6 pt-4 border-t border-gray-700 bg-blue-900/50 p-4 rounded-lg">
                             <h4 className="text-lg font-bold text-white">Nâng cấp lên Synca PRO</h4>
                             <p className="text-gray-300 mt-2 text-sm">
                                Mở khóa các tính năng cao cấp để trở thành một người lái xe thông thái hơn:
                             </p>
                             <ul className="list-disc list-inside mt-3 space-y-1 text-gray-200 text-sm">
                                <li>Cảnh báo tốc độ giới hạn theo thời gian thực.</li>
                                <li>Tính năng dẫn đường thông minh.</li>
                                <li>Và nhiều tính năng khác sắp ra mắt!</li>
                             </ul>
                             <button 
                                onClick={handleUpgradeClick}
                                className="w-full mt-6 px-4 py-3 bg-yellow-500 text-gray-900 font-bold rounded-lg hover:bg-yellow-600 transition-colors shadow-lg"
                             >
                                Nâng cấp lên PRO - 499.000đ/năm
                             </button>
                        </div>
                    )}
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

export default Profile;