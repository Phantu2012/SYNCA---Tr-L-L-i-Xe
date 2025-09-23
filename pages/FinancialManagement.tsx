import React, { useState, useMemo, useEffect, useCallback } from 'react';
import PageHeader from '../components/PageHeader';
import { Transaction, TransactionType, IncomeCategory, ExpenseCategory, Asset, AssetCategory, Debt, DebtCategory, Investment, InvestmentCategory, UserData } from '../types';
import { PlusIcon, EditIcon, DeleteIcon, WalletIcon, FoodIcon, TransportIcon, BillIcon, IncomeIcon, OtherIcon, DashboardIcon, HeartIcon, EntertainmentIcon, FriendsIcon, BookOpenIcon, BanknoteIcon, TrendingUpIcon, CarIcon, CreditCardIcon, ChartBarIcon } from '../components/Icons';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';


// =====================================================================
// 1. ALL HELPER COMPONENTS & DATA DEFINED AT THE TOP LEVEL
// This prevents them from being re-created on every render,
// which is a common source of bugs in React.
// =====================================================================

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
            active ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
        }`}
    >
        {children}
    </button>
);

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const transactionCategoryIcons: { [key in IncomeCategory | ExpenseCategory]: React.ReactElement<{ className?: string }> } = {
    [IncomeCategory.SALARY]: <IncomeIcon />, [IncomeCategory.BONUS]: <IncomeIcon />, [IncomeCategory.SIDE_INCOME]: <IncomeIcon />, [IncomeCategory.GIFT]: <FriendsIcon />, [IncomeCategory.INVESTMENT]: <TrendingUpIcon />, [IncomeCategory.OTHER]: <OtherIcon />,
    [ExpenseCategory.FOOD]: <FoodIcon />, [ExpenseCategory.LIVING]: <DashboardIcon />, [ExpenseCategory.TRANSPORT]: <TransportIcon />, [ExpenseCategory.CHILDREN]: <BookOpenIcon />, [ExpenseCategory.HEALTH]: <HeartIcon />, [ExpenseCategory.ENTERTAINMENT]: <EntertainmentIcon />, [ExpenseCategory.SOCIAL]: <FriendsIcon />, [ExpenseCategory.FINANCE]: <BillIcon />, [ExpenseCategory.OTHER]: <OtherIcon />,
};
const assetCategoryIcons: { [key in AssetCategory]: React.ReactElement<{ className?: string }> } = {
    [AssetCategory.SAVINGS]: <BanknoteIcon />, [AssetCategory.INVESTMENTS]: <TrendingUpIcon />, [AssetCategory.REAL_ESTATE]: <DashboardIcon />, [AssetCategory.VEHICLE]: <CarIcon />, [AssetCategory.OTHER]: <OtherIcon />,
};
const debtCategoryIcons: { [key in DebtCategory]: React.ReactElement<{ className?: string }> } = {
    [DebtCategory.LOAN]: <BanknoteIcon />, [DebtCategory.CREDIT_CARD]: <CreditCardIcon />, [DebtCategory.PERSONAL]: <FriendsIcon />, [DebtCategory.MORTGAGE]: <DashboardIcon />, [DebtCategory.OTHER]: <OtherIcon />,
};
const investmentCategoryIcons: { [key in InvestmentCategory]: React.ReactElement<{ className?: string }> } = {
    [InvestmentCategory.STOCKS]: <ChartBarIcon />, [InvestmentCategory.CRYPTO]: <TrendingUpIcon />, [InvestmentCategory.BONDS]: <BillIcon />, [InvestmentCategory.FUNDS]: <WalletIcon />, [InvestmentCategory.GOLD]: <BanknoteIcon />, [InvestmentCategory.OTHER]: <OtherIcon />,
};

// --- Form Components ---
const TransactionForm: React.FC<{ onSave: (t: Omit<Transaction, 'id'>) => Promise<void>, existingTransaction: Transaction | null, onClose: () => void }> = ({ onSave, existingTransaction, onClose }) => {
    const [type, setType] = useState<TransactionType>(existingTransaction?.type || TransactionType.EXPENSE);
    const [category, setCategory] = useState(existingTransaction?.category || ExpenseCategory.FOOD);
    const [amount, setAmount] = useState(existingTransaction?.amount || 0);
    const [date, setDate] = useState(existingTransaction?.date || new Date().toISOString().slice(0, 10));
    const [notes, setNotes] = useState(existingTransaction?.notes || '');
    const [isSaving, setIsSaving] = useState(false);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave({ type, category, amount, date, notes });
        } finally {
            setIsSaving(false);
        }
    };
    const categories = type === TransactionType.INCOME ? Object.values(IncomeCategory) : Object.values(ExpenseCategory);
    return (<form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-4 p-2 bg-gray-700 rounded-lg">
            <button type="button" onClick={() => {
                setType(TransactionType.EXPENSE);
                setCategory(ExpenseCategory.FOOD);
            }} className={`flex-1 p-2 rounded-md text-sm font-semibold transition-colors ${type === TransactionType.EXPENSE ? 'bg-red-600 text-white' : 'bg-transparent text-gray-300'}`}>Chi phí</button>
            <button type="button" onClick={() => {
                setType(TransactionType.INCOME);
                setCategory(IncomeCategory.SALARY);
            }} className={`flex-1 p-2 rounded-md text-sm font-semibold transition-colors ${type === TransactionType.INCOME ? 'bg-green-600 text-white' : 'bg-transparent text-gray-300'}`}>Thu nhập</button>
        </div>
        <div><label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">Danh mục</label> <select id="category" value={category} onChange={e => setCategory(e.target.value as any)} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2" required> {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)} </select></div>
        <div><label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1">Số tiền</label> <input type="number" id="amount" value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2" required /></div>
        <div><label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-1">Ngày</label> <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2" required /></div>
        <div><label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-1">Ghi chú</label> <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2" rows={2}></textarea></div>
        <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500">Hủy</button> <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-500 text-white font-semibold disabled:bg-blue-800 disabled:cursor-not-allowed">{isSaving ? 'Đang lưu...' : 'Lưu'}</button></div>
    </form>);
};

const AssetForm: React.FC<{ onSave: (a: Omit<Asset, 'id'>) => Promise<void>, existingAsset: Asset | null, onClose: () => void }> = ({ onSave, existingAsset, onClose }) => {
    const [name, setName] = useState(existingAsset?.name || '');
    const [category, setCategory] = useState(existingAsset?.category || AssetCategory.SAVINGS);
    const [value, setValue] = useState(existingAsset?.value || 0);
    const [notes, setNotes] = useState(existingAsset?.notes || '');
    const [isSaving, setIsSaving] = useState(false);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave({ name, category, value, notes });
        } finally {
            setIsSaving(false);
        }
    };
    return (<form onSubmit={handleSubmit} className="space-y-4">
        <div><label htmlFor="asset-name" className="block text-sm font-medium text-gray-300 mb-1">Tên tài sản</label> <input type="text" id="asset-name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2" required /></div>
        <div><label htmlFor="asset-category" className="block text-sm font-medium text-gray-300 mb-1">Danh mục</label> <select id="asset-category" value={category} onChange={e => setCategory(e.target.value as any)} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2" required> {Object.values(AssetCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)} </select></div>
        <div><label htmlFor="asset-value" className="block text-sm font-medium text-gray-300 mb-1">Giá trị (VNĐ)</label> <input type="number" id="asset-value" value={value} onChange={e => setValue(Number(e.target.value))} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2" required /></div>
        <div><label htmlFor="asset-notes" className="block text-sm font-medium text-gray-300 mb-1">Ghi chú</label> <textarea id="asset-notes" value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2" rows={2}></textarea></div>
        <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500">Hủy</button> <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-500 text-white font-semibold disabled:bg-blue-800 disabled:cursor-not-allowed">{isSaving ? 'Đang lưu...' : 'Lưu'}</button></div>
    </form>);
};

const DebtForm: React.FC<{ onSave: (d: Omit<Debt, 'id'>) => Promise<void>, existingDebt: Debt | null, onClose: () => void }> = ({ onSave, existingDebt, onClose }) => {
    const [name, setName] = useState(existingDebt?.name || '');
    const [category, setCategory] = useState(existingDebt?.category || DebtCategory.LOAN);
    const [totalAmount, setTotalAmount] = useState(existingDebt?.totalAmount || 0);
    const [amountPaid, setAmountPaid] = useState(existingDebt?.amountPaid || 0);
    const [isSaving, setIsSaving] = useState(false);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave({ name, category, totalAmount, amountPaid });
        } finally {
            setIsSaving(false);
        }
    };
    return (<form onSubmit={handleSubmit} className="space-y-4">
        <div><label htmlFor="debt-name" className="block text-sm font-medium text-gray-300 mb-1">Tên khoản nợ</label> <input type="text" id="debt-name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-700 text-white rounded-md p-2" required /></div>
        <div><label htmlFor="debt-category" className="block text-sm font-medium text-gray-300 mb-1">Danh mục</label> <select id="debt-category" value={category} onChange={e => setCategory(e.target.value as any)} className="w-full bg-gray-700 text-white rounded-md p-2" required> {Object.values(DebtCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)} </select></div>
        <div><label htmlFor="debt-total" className="block text-sm font-medium text-gray-300 mb-1">Tổng số tiền nợ</label> <input type="number" id="debt-total" value={totalAmount} onChange={e => setTotalAmount(Number(e.target.value))} className="w-full bg-gray-700 text-white rounded-md p-2" required /></div>
        <div><label htmlFor="debt-paid" className="block text-sm font-medium text-gray-300 mb-1">Số tiền đã trả</label> <input type="number" id="debt-paid" value={amountPaid} onChange={e => setAmountPaid(Number(e.target.value))} className="w-full bg-gray-700 text-white rounded-md p-2" required /></div>
        <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500">Hủy</button> <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-500 text-white font-semibold disabled:bg-blue-800 disabled:cursor-not-allowed">{isSaving ? 'Đang lưu...' : 'Lưu'}</button></div>
    </form>);
};

const InvestmentForm: React.FC<{ onSave: (i: Omit<Investment, 'id'>) => Promise<void>, existingInvestment: Investment | null, onClose: () => void }> = ({ onSave, existingInvestment, onClose }) => {
    const [name, setName] = useState(existingInvestment?.name || '');
    const [category, setCategory] = useState(existingInvestment?.category || InvestmentCategory.STOCKS);
    const [initialValue, setInitialValue] = useState(existingInvestment?.initialValue || 0);
    const [currentValue, setCurrentValue] = useState(existingInvestment?.currentValue || 0);
    const [isSaving, setIsSaving] = useState(false);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave({ name, category, initialValue, currentValue });
        } finally {
            setIsSaving(false);
        }
    };
    return (<form onSubmit={handleSubmit} className="space-y-4">
        <div><label htmlFor="inv-name" className="block text-sm font-medium text-gray-300 mb-1">Tên khoản đầu tư</label> <input type="text" id="inv-name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-700 text-white rounded-md p-2" required /></div>
        <div><label htmlFor="inv-category" className="block text-sm font-medium text-gray-300 mb-1">Danh mục</label> <select id="inv-category" value={category} onChange={e => setCategory(e.target.value as any)} className="w-full bg-gray-700 text-white rounded-md p-2" required> {Object.values(InvestmentCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)} </select></div>
        <div><label htmlFor="inv-initial" className="block text-sm font-medium text-gray-300 mb-1">Giá trị ban đầu</label> <input type="number" id="inv-initial" value={initialValue} onChange={e => setInitialValue(Number(e.target.value))} className="w-full bg-gray-700 text-white rounded-md p-2" required /></div>
        <div><label htmlFor="inv-current" className="block text-sm font-medium text-gray-300 mb-1">Giá trị hiện tại</label> <input type="number" id="inv-current" value={currentValue} onChange={e => setCurrentValue(Number(e.target.value))} className="w-full bg-gray-700 text-white rounded-md p-2" required /></div>
        <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500">Hủy</button> <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-500 text-white font-semibold disabled:bg-blue-800 disabled:cursor-not-allowed">{isSaving ? 'Đang lưu...' : 'Lưu'}</button></div>
    </form>);
};

// --- Tab Components ---
const TransactionsTab: React.FC<{ transactions: Transaction[], onEdit: (t: Transaction) => void, onDelete: (id: string) => void }> = ({ transactions, onEdit, onDelete }) => {
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return (
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <ul className="divide-y divide-gray-700"> {sortedTransactions.map(t => (<li key={t.id} className="p-4 flex items-center justify-between hover:bg-gray-700/50">
                <div className="flex items-center gap-4"> <span className={`p-2 rounded-full ${t.type === TransactionType.INCOME ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}> {React.cloneElement(transactionCategoryIcons[t.category], { className: "w-6 h-6" })} </span>
                    <div>
                        <p className="font-semibold text-white">{t.category}</p>
                        <p className="text-sm text-gray-400">{new Date(t.date).toLocaleDateString('vi-VN')}</p> {t.notes && <p className="text-xs text-gray-500 italic">"{t.notes}"</p>}
                    </div>
                </div>
                <div className="text-right">
                    <p className={`font-bold text-lg ${t.type === TransactionType.INCOME ? 'text-green-400' : 'text-red-400'}`}> {t.type === TransactionType.INCOME ? '+' : '-'} {formatCurrency(t.amount)} </p>
                    <div className="flex gap-3 justify-end mt-1">
                        <button onClick={() => onEdit(t)} className="text-gray-400 hover:text-white"><EditIcon /></button>
                        <button onClick={() => onDelete(t.id)} className="text-gray-400 hover:text-red-500"><DeleteIcon /></button>
                    </div>
                </div>
            </li>))} </ul>
            {transactions.length === 0 && <p className="p-6 text-center text-gray-400">Chưa có giao dịch nào.</p>}
        </div>
    );
};

const OverviewTab: React.FC<{ transactions: Transaction[], assets: Asset[], debts: Debt[], investments: Investment[], onEditTransaction: (t: Transaction) => void, onDeleteTransaction: (id: string) => void }> = ({ transactions, assets, debts, investments, onEditTransaction, onDeleteTransaction }) => {
    const { totalIncome, totalExpense, balance, totalAssets, totalDebts, totalInvestments, netWorth } = useMemo(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        const thisMonthTxs = transactions.filter(t => t.date >= firstDay);
        // Fix: Explicitly type accumulator in reduce to prevent type inference issues.
        const totalIncome = thisMonthTxs.filter(t => t.type === TransactionType.INCOME).reduce((sum: number, t) => sum + t.amount, 0);
        // Fix: Explicitly type accumulator in reduce to prevent type inference issues.
        const totalExpense = thisMonthTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((sum: number, t) => sum + t.amount, 0);
        // Fix: Explicitly type accumulator in reduce to prevent type inference issues.
        const totalAssets = assets.reduce((sum: number, a) => sum + a.value, 0);
        // Fix: Explicitly type accumulator in reduce to prevent type inference issues. This fixes errors on line 269.
        const totalDebts = debts.reduce((sum: number, d) => sum + (d.totalAmount - d.amountPaid), 0);
        // Fix: Explicitly type accumulator in reduce to prevent type inference issues. This fixes error on line 270.
        const totalInvestments = investments.reduce((sum: number, i) => sum + i.currentValue, 0);
        return { totalIncome, totalExpense, balance: totalIncome - totalExpense, totalAssets, totalDebts, totalInvestments, netWorth: totalAssets + totalInvestments - totalDebts };
    }, [transactions, assets, debts, investments]);
    return (
        <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg text-center">
                <p className="text-lg font-semibold text-gray-300">Giá trị tài sản ròng</p>
                <p className="text-4xl font-bold text-blue-400 mt-2">{formatCurrency(netWorth)}</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-800 p-4 rounded-lg text-center"><p className="text-sm text-gray-400">Tài sản</p><p className="text-xl font-bold text-green-400">{formatCurrency(totalAssets)}</p></div>
                <div className="bg-gray-800 p-4 rounded-lg text-center"><p className="text-sm text-gray-400">Đầu tư</p><p className="text-xl font-bold text-green-400">{formatCurrency(totalInvestments)}</p></div>
                <div className="bg-gray-800 p-4 rounded-lg text-center"><p className="text-sm text-gray-400">Tổng nợ</p><p className="text-xl font-bold text-red-400">{formatCurrency(totalDebts)}</p></div>
                <div className="bg-gray-800 p-4 rounded-lg text-center"><p className="text-sm text-gray-400">Số dư tháng</p><p className="text-xl font-bold text-white">{formatCurrency(balance)}</p></div>
            </div>
            <div>
                <h3 className="font-semibold text-white mb-2">Giao dịch gần đây</h3>
                <TransactionsTab transactions={[...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)} onEdit={onEditTransaction} onDelete={onDeleteTransaction} />
            </div>
        </div>
    );
};

const ReportsTab: React.FC<{ transactions: Transaction[] }> = ({ transactions }) => {
    const [period, setPeriod] = useState<'week' | 'month' | 'year' | 'custom'>('month');
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
    const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

    const { filteredTransactions, totalIncome, totalExpense, expenseByCategory, incomeByCategory } = useMemo(() => {
        const now = new Date();
        let startFilterDate = new Date();
        let endFilterDate = new Date(now);
        endFilterDate.setHours(23, 59, 59, 999); 

        switch (period) {
            case 'week':
                const dayOfWeek = now.getDay();
                const firstDayOfWeek = new Date(now);
                firstDayOfWeek.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); 
                startFilterDate = firstDayOfWeek;
                break;
            case 'month':
                startFilterDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startFilterDate = new Date(now.getFullYear(), 0, 1);
                break;
            case 'custom':
                startFilterDate = startDate ? new Date(startDate) : new Date('1970-01-01');
                endFilterDate = endDate ? new Date(endDate) : new Date();
                endFilterDate.setHours(23, 59, 59, 999);
                break;
        }
        startFilterDate.setHours(0, 0, 0, 0); 

        const filtered = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= startFilterDate && tDate <= endFilterDate;
        });

        const income = filtered.filter(t => t.type === TransactionType.INCOME);
        const expense = filtered.filter(t => t.type === TransactionType.EXPENSE);

        // Fix: Explicitly type accumulator in reduce to prevent type inference issues.
        const totalIncome = income.reduce((sum: number, t) => sum + t.amount, 0);
        // Fix: Explicitly type accumulator in reduce to prevent type inference issues.
        const totalExpense = expense.reduce((sum: number, t) => sum + t.amount, 0);

        const aggregate = (txs: Transaction[]) => {
            // Fix: Explicitly type accumulator in reduce to resolve assignment errors. This fixes error on line 281.
            return txs.reduce((acc: Record<string, number>, t) => {
                acc[t.category] = (acc[t.category] || 0) + t.amount;
                return acc;
            }, {});
        };
        
        const expenseByCategory = aggregate(expense);
        const incomeByCategory = aggregate(income);

        return { filteredTransactions: filtered, totalIncome, totalExpense, expenseByCategory, incomeByCategory };
    }, [transactions, period, startDate, endDate]);

    // Fix: This calculation now uses correctly typed variables, resolving the error on line 284.
    const netFlow = totalIncome - totalExpense;

    const BarChart: React.FC<{ data: Record<string, number>, title: string, color: string }> = ({ data, title, color }) => {
        const sortedData = Object.entries(data).sort(([, a], [, b]) => b - a);
        const maxValue = Math.max(...Object.values(data), 1);
        if (sortedData.length === 0) return null;

        return (
            <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-4">{title}</h4>
                <div className="space-y-3">
                    {sortedData.map(([category, amount]) => (
                        <div key={category}>
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span className="text-gray-300">{category}</span>
                                <span className="font-semibold text-white">{formatCurrency(amount)}</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2.5">
                                <div className={`${color} h-2.5 rounded-full`} style={{ width: `${(amount / maxValue) * 100}%` }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="bg-gray-800 p-4 rounded-lg">
                <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => setPeriod('week')} className={`px-3 py-1.5 text-sm rounded-md ${period === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}>Tuần này</button>
                    <button onClick={() => setPeriod('month')} className={`px-3 py-1.5 text-sm rounded-md ${period === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}>Tháng này</button>
                    <button onClick={() => setPeriod('year')} className={`px-3 py-1.5 text-sm rounded-md ${period === 'year' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}>Năm nay</button>
                    <button onClick={() => setPeriod('custom')} className={`px-3 py-1.5 text-sm rounded-md ${period === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}>Tùy chọn</button>
                </div>
                {period === 'custom' && (
                    <div className="mt-4 flex flex-col sm:flex-row gap-4">
                        <div>
                            <label htmlFor="startDate" className="text-sm text-gray-400 block mb-1">Từ ngày</label>
                            <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-gray-700 border-gray-600 text-white rounded-md p-2 w-full"/>
                        </div>
                        <div>
                             <label htmlFor="endDate" className="text-sm text-gray-400 block mb-1">Đến ngày</label>
                            <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-gray-700 border-gray-600 text-white rounded-md p-2 w-full"/>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-gray-800 p-4 rounded-lg"><p className="text-sm text-gray-400">Tổng Thu nhập</p><p className="text-2xl font-bold text-green-400">{formatCurrency(totalIncome)}</p></div>
                <div className="bg-gray-800 p-4 rounded-lg"><p className="text-sm text-gray-400">Tổng Chi tiêu</p><p className="text-2xl font-bold text-red-400">{formatCurrency(totalExpense)}</p></div>
                <div className="bg-gray-800 p-4 rounded-lg"><p className="text-sm text-gray-400">Dòng tiền</p><p className={`text-2xl font-bold ${netFlow >= 0 ? 'text-blue-400' : 'text-yellow-400'}`}>{formatCurrency(netFlow)}</p></div>
            </div>

            {filteredTransactions.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <BarChart data={expenseByCategory} title="Phân tích Chi tiêu" color="bg-red-500" />
                    <BarChart data={incomeByCategory} title="Phân tích Thu nhập" color="bg-green-500" />
                </div>
            ) : (
                <div className="bg-gray-800 p-6 rounded-lg text-center text-gray-400">
                    <p>Không có dữ liệu giao dịch trong khoảng thời gian đã chọn.</p>
                </div>
            )}
        </div>
    );
};

const AssetsTab: React.FC<{ assets: Asset[], onAdd: () => void, onEdit: (a: Asset) => void, onDelete: (id: string) => void }> = ({ assets, onAdd, onEdit, onDelete }) => {
    const totalValue = useMemo(() => assets.reduce((sum, asset) => sum + asset.value, 0), [assets]);
    return (<div className="space-y-6">
        <div className="bg-gray-800 p-6 rounded-lg flex justify-between items-center">
            <div>
                <h3 className="text-xl font-bold text-white">Tổng giá trị tài sản</h3>
                <p className="text-3xl font-bold text-blue-400 mt-1">{formatCurrency(totalValue)}</p>
            </div>
            <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700"> <PlusIcon /> Thêm </button>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <ul className="divide-y divide-gray-700"> {assets.map(asset => (<li key={asset.id} className="p-4 flex items-center justify-between hover:bg-gray-700/50">
                <div className="flex items-center gap-4"> <span className="p-2 rounded-full bg-gray-700 text-blue-400"> {React.cloneElement(assetCategoryIcons[asset.category], { className: "w-6 h-6" })} </span>
                    <div>
                        <p className="font-semibold text-white">{asset.name}</p>
                        <p className="text-sm text-gray-400">{asset.category}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-bold text-lg text-white">{formatCurrency(asset.value)}</p>
                    <div className="flex gap-3 justify-end mt-1">
                        <button onClick={() => onEdit(asset)} className="text-gray-400 hover:text-white"><EditIcon /></button>
                        <button onClick={() => onDelete(asset.id)} className="text-gray-400 hover:text-red-500"><DeleteIcon /></button>
                    </div>
                </div>
            </li>))} </ul> {assets.length === 0 && <p className="p-6 text-center text-gray-400">Chưa có tài sản nào.</p>}
        </div>
    </div>);
};

const DebtsTab: React.FC<{ debts: Debt[], onAdd: () => void, onEdit: (d: Debt) => void, onDelete: (id: string) => void }> = ({ debts, onAdd, onEdit, onDelete }) => {
    const { totalDebt, totalPaid } = useMemo(() => {
        const totalDebt = debts.reduce((sum, d) => sum + d.totalAmount, 0);
        const totalPaid = debts.reduce((sum, d) => sum + d.amountPaid, 0);
        return { totalDebt, totalPaid };
    }, [debts]);
    return (<div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-gray-800 p-6 rounded-lg"><h3 className="text-lg font-semibold text-white">Tổng Nợ</h3><p className="text-2xl font-bold text-red-400 mt-1">{formatCurrency(totalDebt)}</p></div>
            <div className="md:col-span-1 bg-gray-800 p-6 rounded-lg"><h3 className="text-lg font-semibold text-white">Đã Trả</h3><p className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(totalPaid)}</p></div>
            <div className="md:col-span-1 bg-gray-800 p-6 rounded-lg"><h3 className="text-lg font-semibold text-white">Còn Lại</h3><p className="text-2xl font-bold text-yellow-400 mt-1">{formatCurrency(totalDebt - totalPaid)}</p></div>
        </div>
        <div className="flex justify-end"><button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700"><PlusIcon /> Thêm Khoản nợ</button></div>
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <ul className="divide-y divide-gray-700"> {debts.map(debt => (<li key={debt.id} className="p-4 hover:bg-gray-700/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4"> <span className="p-2 rounded-full bg-gray-700 text-red-400">{React.cloneElement(debtCategoryIcons[debt.category], { className: "w-6 h-6" })}</span>
                        <div>
                            <p className="font-semibold text-white">{debt.name}</p>
                            <p className="text-sm text-gray-400">{debt.category}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-lg text-white">{formatCurrency(debt.totalAmount - debt.amountPaid)}</p>
                        <p className="text-xs text-gray-500">còn lại</p>
                        <div className="flex gap-3 justify-end mt-1">
                            <button onClick={() => onEdit(debt)} className="text-gray-400 hover:text-white"><EditIcon /></button>
                            <button onClick={() => onDelete(debt.id)} className="text-gray-400 hover:text-red-500"><DeleteIcon /></button>
                        </div>
                    </div>
                </div>
                <div className="mt-2"><div className="w-full bg-gray-700 rounded-full h-2.5"><div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(debt.totalAmount > 0 ? debt.amountPaid / debt.totalAmount : 0) * 100}%` }}></div></div><p className="text-xs text-gray-500 text-right mt-1">{((debt.totalAmount > 0 ? debt.amountPaid / debt.totalAmount : 0) * 100).toFixed(0)}% đã trả</p></div>
            </li>))} </ul> {debts.length === 0 && <p className="p-6 text-center text-gray-400">Chưa có khoản nợ nào.</p>}
        </div>
    </div>);
};

const InvestmentsTab: React.FC<{ investments: Investment[], onAdd: () => void, onEdit: (i: Investment) => void, onDelete: (id: string) => void }> = ({ investments, onAdd, onEdit, onDelete }) => {
    const { totalValue, totalProfit } = useMemo(() => {
        const totalValue = investments.reduce((sum, i) => sum + i.currentValue, 0);
        const totalInitial = investments.reduce((sum, i) => sum + i.initialValue, 0);
        return { totalValue, totalProfit: totalValue - totalInitial };
    }, [investments]);
    return (<div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 p-6 rounded-lg"><h3 className="text-lg font-semibold text-white">Tổng giá trị Đầu tư</h3><p className="text-2xl font-bold text-blue-400 mt-1">{formatCurrency(totalValue)}</p></div>
            <div className="bg-gray-800 p-6 rounded-lg"><h3 className="text-lg font-semibold text-white">Lợi nhuận/Thua lỗ</h3><p className={`text-2xl font-bold mt-1 ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(totalProfit)}</p></div>
        </div>
        <div className="flex justify-end"><button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700"><PlusIcon /> Thêm Khoản đầu tư</button></div>
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <ul className="divide-y divide-gray-700"> {investments.map(inv => {
                const profit = inv.currentValue - inv.initialValue; return (<li key={inv.id} className="p-4 flex items-center justify-between hover:bg-gray-700/50">
                    <div className="flex items-center gap-4"> <span className="p-2 rounded-full bg-gray-700 text-green-400">{React.cloneElement(investmentCategoryIcons[inv.category], { className: "w-6 h-6" })}</span>
                        <div>
                            <p className="font-semibold text-white">{inv.name}</p>
                            <p className="text-sm text-gray-400">{inv.category}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-lg text-white">{formatCurrency(inv.currentValue)}</p>
                        <p className={`text-sm font-semibold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{profit >= 0 ? '+' : ''}{formatCurrency(profit)}</p>
                        <div className="flex gap-3 justify-end mt-1">
                            <button onClick={() => onEdit(inv)} className="text-gray-400 hover:text-white"><EditIcon /></button>
                            <button onClick={() => onDelete(inv.id)} className="text-gray-400 hover:text-red-500"><DeleteIcon /></button>
                        </div>
                    </div>
                </li>);
            })} </ul> {investments.length === 0 && <p className="p-6 text-center text-gray-400">Chưa có khoản đầu tư nào.</p>}
        </div>
    </div>);
};

// =====================================================================
// 2. MAIN COMPONENT DEFINITION
// =====================================================================

const FinancialManagement: React.FC = () => {
    const { getUserData, updateUserData, currentUser } = useAuth();

    // --- State Management ---
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [debts, setDebts] = useState<Debt[]>([]);
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
     const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getUserData();
            setTransactions(data.financials?.transactions || []);
            setAssets(data.financials?.assets || []);
            setDebts(data.financials?.debts || []);
            setInvestments(data.financials?.investments || []);
        } catch(err) {
            console.error("Failed to fetch financial data:", err);
            setError("Không thể tải dữ liệu tài chính. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    }, [getUserData]);

    useEffect(() => {
        if (currentUser) {
            fetchData();
        }
    }, [currentUser, fetchData]);

    const updateFinancials = async (updatedData: Partial<UserData['financials']>) => {
        const currentData = { transactions, assets, debts, investments };
        const newData = { ...currentData, ...updatedData };

        if (updatedData.transactions) setTransactions(updatedData.transactions);
        if (updatedData.assets) setAssets(updatedData.assets);
        if (updatedData.debts) setDebts(updatedData.debts);
        if (updatedData.investments) setInvestments(updatedData.investments);
        
        await updateUserData({ financials: newData });
    };

    const [activeTab, setActiveTab] = useState<'transactions' | 'overview' | 'reports' | 'assets' | 'debts' | 'investments'>('overview');
    
    // State for modals
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
    const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
    
    // State for editing items
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
    const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
    const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
    
    // --- Handlers for Transactions ---
    const handleOpenTransactionModal = (item?: Transaction) => { setEditingTransaction(item || null); setIsTransactionModalOpen(true); };
    const handleCloseTransactionModal = () => { setEditingTransaction(null); setIsTransactionModalOpen(false); };
    const handleSaveTransaction = async (item: Omit<Transaction, 'id'>) => {
        const updatedItems = editingTransaction
            ? transactions.map(i => i.id === editingTransaction.id ? { ...item, id: editingTransaction.id } : i)
            : [...transactions, { ...item, id: Date.now().toString() }];
        await updateFinancials({ transactions: updatedItems });
        handleCloseTransactionModal();
    };
    const handleDeleteTransaction = async (id: string) => {
        const updatedItems = transactions.filter(i => i.id !== id);
        await updateFinancials({ transactions: updatedItems });
    };

    // --- Handlers for Assets ---
    const handleOpenAssetModal = (item?: Asset) => { setEditingAsset(item || null); setIsAssetModalOpen(true); };
    const handleCloseAssetModal = () => { setEditingAsset(null); setIsAssetModalOpen(false); };
    const handleSaveAsset = async (item: Omit<Asset, 'id'>) => {
        const updatedItems = editingAsset
            ? assets.map(i => i.id === editingAsset.id ? { ...item, id: editingAsset.id } : i)
            : [...assets, { ...item, id: Date.now().toString() }];
        await updateFinancials({ assets: updatedItems });
        handleCloseAssetModal();
    };
    const handleDeleteAsset = async (id: string) => {
        const updatedItems = assets.filter(i => i.id !== id);
        await updateFinancials({ assets: updatedItems });
    };

    // --- Handlers for Debts ---
    const handleOpenDebtModal = (item?: Debt) => { setEditingDebt(item || null); setIsDebtModalOpen(true); };
    const handleCloseDebtModal = () => { setEditingDebt(null); setIsDebtModalOpen(false); };
    const handleSaveDebt = async (item: Omit<Debt, 'id'>) => {
        const updatedItems = editingDebt
            ? debts.map(i => i.id === editingDebt.id ? { ...item, id: editingDebt.id } : i)
            : [...debts, { ...item, id: Date.now().toString() }];
        await updateFinancials({ debts: updatedItems });
        handleCloseDebtModal();
    };
    const handleDeleteDebt = async (id: string) => {
        const updatedItems = debts.filter(i => i.id !== id);
        await updateFinancials({ debts: updatedItems });
    };

    // --- Handlers for Investments ---
    const handleOpenInvestmentModal = (item?: Investment) => { setEditingInvestment(item || null); setIsInvestmentModalOpen(true); };
    const handleCloseInvestmentModal = () => { setEditingInvestment(null); setIsInvestmentModalOpen(false); };
    const handleSaveInvestment = async (item: Omit<Investment, 'id'>) => {
        const updatedItems = editingInvestment
            ? investments.map(i => i.id === editingInvestment.id ? { ...item, id: editingInvestment.id } : i)
            : [...investments, { ...item, id: Date.now().toString() }];
        await updateFinancials({ investments: updatedItems });
        handleCloseInvestmentModal();
    };
    const handleDeleteInvestment = async (id: string) => {
        const updatedItems = investments.filter(i => i.id !== id);
        await updateFinancials({ investments: updatedItems });
    };


    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            )
        }
        if (error) {
             return (
                <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center mt-6">
                    <p className="font-bold">Đã xảy ra lỗi</p>
                    <p>{error}</p>
                </div>
            )
        }
        switch (activeTab) {
            case 'transactions': return <TransactionsTab transactions={transactions} onEdit={handleOpenTransactionModal} onDelete={handleDeleteTransaction} />;
            case 'overview': return <OverviewTab transactions={transactions} assets={assets} debts={debts} investments={investments} onEditTransaction={handleOpenTransactionModal} onDeleteTransaction={handleDeleteTransaction} />;
            case 'reports': return <ReportsTab transactions={transactions} />;
            case 'assets': return <AssetsTab assets={assets} onAdd={() => handleOpenAssetModal()} onEdit={handleOpenAssetModal} onDelete={handleDeleteAsset} />;
            case 'debts': return <DebtsTab debts={debts} onAdd={() => handleOpenDebtModal()} onEdit={handleOpenDebtModal} onDelete={handleDeleteDebt} />;
            case 'investments': return <InvestmentsTab investments={investments} onAdd={() => handleOpenInvestmentModal()} onEdit={handleOpenInvestmentModal} onDelete={handleDeleteInvestment} />;
            default: return null;
        }
    };

    return (
        <div>
            <PageHeader title="Quản lý Tài chính" subtitle="Theo dõi dòng tiền, quản lý chi tiêu và đạt được mục tiêu tài chính của gia đình." />
            
            <div className="flex justify-between items-center mb-6">
                <div className="flex space-x-1 sm:space-x-2 border-b border-gray-700 pb-2 overflow-x-auto">
                    <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>Tổng quan</TabButton>
                    <TabButton active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')}>Giao dịch</TabButton>
                    <TabButton active={activeTab === 'assets'} onClick={() => setActiveTab('assets')}>Tài sản</TabButton>
                    <TabButton active={activeTab === 'debts'} onClick={() => setActiveTab('debts')}>Các khoản nợ</TabButton>
                    <TabButton active={activeTab === 'investments'} onClick={() => setActiveTab('investments')}>Đầu tư</TabButton>
                    <TabButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')}>Báo cáo</TabButton>
                </div>
                 <button onClick={() => handleOpenTransactionModal()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 whitespace-nowrap">
                    <PlusIcon /> Thêm Giao dịch
                </button>
            </div>

            {renderContent()}

            <Modal isOpen={isTransactionModalOpen} onClose={handleCloseTransactionModal} title={editingTransaction ? "Chỉnh sửa Giao dịch" : "Thêm Giao dịch mới"}> <TransactionForm onSave={handleSaveTransaction} existingTransaction={editingTransaction} onClose={handleCloseTransactionModal} /> </Modal>
            <Modal isOpen={isAssetModalOpen} onClose={handleCloseAssetModal} title={editingAsset ? "Chỉnh sửa Tài sản" : "Thêm Tài sản mới"}> <AssetForm onSave={handleSaveAsset} existingAsset={editingAsset} onClose={handleCloseAssetModal} /> </Modal>
            <Modal isOpen={isDebtModalOpen} onClose={handleCloseDebtModal} title={editingDebt ? "Chỉnh sửa Khoản nợ" : "Thêm Khoản nợ mới"}> <DebtForm onSave={handleSaveDebt} existingDebt={editingDebt} onClose={handleCloseDebtModal} /> </Modal>
            <Modal isOpen={isInvestmentModalOpen} onClose={handleCloseInvestmentModal} title={editingInvestment ? "Chỉnh sửa Khoản đầu tư" : "Thêm Khoản đầu tư mới"}> <InvestmentForm onSave={handleSaveInvestment} existingInvestment={editingInvestment} onClose={handleCloseInvestmentModal} /> </Modal>
        </div>
    );
};

export default FinancialManagement;