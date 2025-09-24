import React from 'react';
import { Page } from '../types';

interface HeaderProps {
    onMenuClick: () => void;
    activePage: Page;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, activePage }) => {
    return (
        <header className="lg:hidden flex items-center justify-between mb-4 text-white">
            <button
                onClick={onMenuClick}
                className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
                aria-label="Mở menu"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
            </button>
            <h2 className="text-lg font-bold">{activePage}</h2>
            <div className="w-8"></div> {/* Spacer to center the title */}
        </header>
    );
};

export default Header;