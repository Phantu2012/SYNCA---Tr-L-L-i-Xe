import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import { getMaintenanceTips } from '../services/geminiService';
import { Page } from '../types';
import { DocumentIcon, HeartIcon, CarIcon, SpeedometerIcon } from '../components/Icons';

interface FeatureCardProps {
    // FIX: Use a more specific type for the icon prop to ensure it's a clonable element that accepts a className.
    icon: React.ReactElement<{ className?: string }>;
    title: string;
    description: string;
    onClick: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, onClick }) => (
    <button
        onClick={onClick}
        className="bg-gray-800 p-6 rounded-lg shadow-lg text-center flex flex-col items-center justify-center transform hover:scale-105 hover:bg-gray-700/50 transition-all duration-300 ease-in-out group"
    >
        <div className="mb-4 text-blue-400 group-hover:text-blue-300 transition-colors duration-300">
            {/* FIX: Remove unnecessary type assertion. The error is resolved by fixing icon component props. */}
            {React.cloneElement(icon, { className: "w-16 h-16" })}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm">{description}</p>
    </button>
);


interface DashboardProps {
    setActivePage: (page: Page) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setActivePage }) => {
    const [tip, setTip] = useState<string>('Đang tải mẹo hay...');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTip = async () => {
            setIsLoading(true);
            const prompt = "Hãy cho tôi một mẹo bảo dưỡng xe hơi nhanh chóng và hữu ích cho người mới bắt đầu.";
            const newTip = await getMaintenanceTips(prompt);
            setTip(newTip);
            setIsLoading(false);
        };
        fetchTip();
    }, []);

    const features = [
        {
            page: Page.DOCUMENTS,
            title: "Giấy tờ Xe",
            description: "Quản lý đăng kiểm, bảo hiểm & phí",
            icon: <DocumentIcon />,
        },
        {
            page: Page.VEHICLE_LOG,
            title: "Sổ tay Sức khỏe",
            description: "Ghi chép lịch sử bảo dưỡng xe",
            icon: <CarIcon />,
        },
        {
            page: Page.LIFE_ASSISTANT,
            title: "Trợ lý Cuộc sống",
            description: "Nhắc nhở sự kiện, mục tiêu cá nhân",
            icon: <HeartIcon />,
        },
        {
            page: Page.SPEED_WARNING,
            title: "Cảnh báo Tốc độ",
            description: "Lái xe an toàn hơn với tính năng VIP",
            icon: <SpeedometerIcon />,
        },
    ];

    return (
        <div>
            <PageHeader title="Trang chủ Synca" subtitle="Chào mừng trở lại! Chọn một tính năng để bắt đầu." />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {features.map((feature) => (
                    <FeatureCard
                        key={feature.page}
                        icon={feature.icon}
                        title={feature.title}
                        description={feature.description}
                        onClick={() => setActivePage(feature.page)}
                    />
                ))}
            </div>

            {/* AI Maintenance Tip */}
            <div className="bg-blue-900/50 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold text-blue-300 mb-4">Mẹo vặt từ Chuyên gia AI</h3>
                {isLoading ? (
                    <div className="flex justify-center items-center h-full min-h-[50px]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-300"></div>
                    </div>
                ) : (
                    <p className="text-gray-300 leading-relaxed">{tip}</p>
                )}
            </div>
        </div>
    );
};

export default Dashboard;