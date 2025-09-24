import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import { getDailyQuote, DailyQuote } from '../services/geminiService';
import { Page } from '../types';
import { DocumentIcon, CarIcon, SeedlingIcon, FlagIcon, WalletIcon, GiftIcon } from '../components/Icons';

interface FeatureCardProps {
    icon: React.ReactElement<{ className?: string }>;
    title: string;
    description: string;
    onClick: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, onClick }) => (
    <button
        onClick={onClick}
        className="bg-gray-800 p-4 rounded-lg shadow-lg text-center flex flex-col items-center justify-center transform hover:scale-105 hover:bg-gray-700/50 transition-all duration-300 ease-in-out group"
    >
        <div className="mb-3 text-blue-400 group-hover:text-blue-300 transition-colors duration-300">
            {React.cloneElement(icon, { className: "w-10 h-10" })}
        </div>
        <h3 className="text-base font-bold text-white mb-1 leading-tight">{title}</h3>
        <p className="text-gray-400 text-xs">{description}</p>
    </button>
);


interface DashboardProps {
    setActivePage: (page: Page) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setActivePage }) => {
    const [quote, setQuote] = useState<DailyQuote | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchQuote = async () => {
            setIsLoading(true);
            setError(null);
            const result = await getDailyQuote();
            if ('error' in result) {
                setError(result.error);
            } else {
                setQuote(result);
            }
            setIsLoading(false);
        };
        fetchQuote();
    }, []);

    const features = [
        {
            page: Page.DOCUMENTS,
            title: "GIẤY TỜ QUẢN LÝ",
            description: "Quản lý giấy tờ xe, cá nhân và các loại thẻ quan trọng.",
            icon: <DocumentIcon />,
        },
        {
            page: Page.VEHICLE_LOG,
            title: "NHẬT KÝ CHĂM SÓC XE",
            description: "Ghi chép lịch sử bảo dưỡng",
            icon: <CarIcon />,
        },
        {
            page: Page.EVENT_CALENDAR,
            title: "KẾT NỐI CUỘC SỐNG",
            description: "Quản lý sinh nhật, ngày giỗ",
            icon: <GiftIcon />,
        },
        {
            page: Page.FINANCIAL_MANAGEMENT,
            title: "QUẢN LÝ TÀI CHÍNH",
            description: "Theo dõi thu chi gia đình",
            icon: <WalletIcon />,
        },
        {
            page: Page.SELF_DEVELOPMENT,
            title: "PHÁT TRIỂN BẢN THÂN",
            description: "Rèn luyện thói quen & tâm hồn",
            icon: <SeedlingIcon />,
        },
        {
            page: Page.LIFE_GOALS,
            title: "MỤC TIÊU CUỘC SỐNG",
            description: "Thiết lập mục tiêu, tầm nhìn",
            icon: <FlagIcon />,
        },
    ];

    return (
        <div>
            <PageHeader title="Trang chủ Synca" subtitle="Chào mừng trở lại! Chọn một tính năng để bắt đầu." />

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
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

            {/* AI Daily Quote Section */}
            <div className="bg-blue-900/50 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold text-blue-300 mb-4">Thông điệp Yêu thương Mỗi ngày</h3>
                {isLoading ? (
                    <div className="flex justify-center items-center h-full min-h-[100px]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-300"></div>
                    </div>
                ) : error ? (
                     <p className="text-red-400">{error}</p>
                ) : quote ? (
                    <div className="space-y-4">
                        <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-200 text-lg">
                            "{quote.quote}"
                        </blockquote>
                        <p className="text-right text-gray-400 font-medium">-- {quote.author}</p>
                        <p className="text-gray-300 leading-relaxed pt-2 border-t border-blue-800/50">{quote.analysis}</p>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default Dashboard;