import React from 'react';

interface PageHeaderProps {
    title: string;
    subtitle: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle }) => {
    return (
        <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{title}</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{subtitle}</p>
        </div>
    );
};

export default PageHeader;