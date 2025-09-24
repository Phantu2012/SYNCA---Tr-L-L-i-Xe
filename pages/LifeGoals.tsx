/** @jsxRuntime classic */
import React, { useState, useEffect, useCallback } from 'https://esm.sh/react@18.2.0';
import PageHeader from '../components/PageHeader';
import { LifeGoal, ActionStep, GoalCategory, VisionBoardImage } from '../types';
import Modal from '../components/Modal';
import { PlusIcon, EditIcon, DeleteIcon } from '../components/Icons';
import { useAuth } from '../contexts/AuthContext';

// --- Reusable Tab Component ---
const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            active ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
        }`}
    >
        {children}
    </button>
);

// --- Goal Setting Component ---
const GoalSetting: React.FC<{
    goals: LifeGoal[];
    onSave: (goal: Omit<LifeGoal, 'id' | 'actionSteps'> & { actionSteps: Omit<ActionStep, 'id' | 'isCompleted'>[] }, existingId?: string) => Promise<void>;
    onDelete: (id: string) => void;
    onToggleStep: (goalId: string, stepId: string) => void;
}> = ({ goals, onSave, onDelete, onToggleStep }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<LifeGoal | null>(null);

    const handleOpenModal = (goal?: LifeGoal) => {
        setEditingGoal(goal || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingGoal(null);
    };
    
    const handleSaveGoal = async (goalData: Omit<LifeGoal, 'id' | 'actionSteps'> & { actionSteps: Omit<ActionStep, 'id' | 'isCompleted'>[] }) => {
        await onSave(goalData, editingGoal?.id);
        handleCloseModal();
    };

    const goalsByCategory = Object.values(GoalCategory).map(category => ({
        category,
        goals: goals.filter(g => g.category === category)
    }));

    return (
        <div className="mt-6">
            <div className="flex justify-end mb-6">
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">
                    <PlusIcon /> Thêm Mục tiêu
                </button>
            </div>
            <div className="space-y-6">
                {goalsByCategory.map(({ category, goals }) => (
                    <div key={category}>
                        <h3 className="text-xl font-bold text-blue-400 mb-3">{category}</h3>
                        <div className="space-y-4">
                            {goals.map(goal => (
                                <div key={goal.id} className="bg-gray-800 p-4 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-lg text-white">{goal.title}</p>
                                            {goal.targetDate && <p className="text-xs text-gray-400">Hạn chót: {new Date(goal.targetDate).toLocaleDateString('vi-VN')}</p>}
                                        </div>
                                        <div className="flex gap-3">
                                             <button onClick={() => handleOpenModal(goal)} className="text-gray-400 hover:text-white"><EditIcon /></button>
                                             <button onClick={() => onDelete(goal.id)} className="text-gray-400 hover:text-red-500"><DeleteIcon /></button>
                                        </div>
                                    </div>
                                    <div className="mt-3 space-y-2">
                                        {goal.actionSteps.map(step => (
                                            <label key={step.id} className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
                                                <input type="checkbox" checked={step.isCompleted} onChange={() => onToggleStep(goal.id, step.id)} className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-500 rounded focus:ring-blue-600" />
                                                <span className={step.isCompleted ? 'line-through text-gray-500' : ''}>{step.text}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                             {goals.length === 0 && <p className="text-gray-500 italic text-sm">Chưa có mục tiêu nào trong mục này.</p>}
                        </div>
                    </div>
                ))}
            </div>
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingGoal ? "Chỉnh sửa Mục tiêu" : "Thêm Mục tiêu mới"}>
                <GoalForm onSave={handleSaveGoal} existingGoal={editingGoal} onClose={handleCloseModal} />
            </Modal>
        </div>
    );
};

// --- Vision Board Component ---
const VisionBoard: React.FC<{ images: VisionBoardImage[], onAdd: (url: string, name: string) => void, onDelete: (id: string) => void }> = ({ images, onAdd, onDelete }) => {
    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const name = file.name.split('.').slice(0, -1).join('.') || 'Hình ảnh mới';
                onAdd(e.target?.result as string, name);
            };
            reader.readAsDataURL(file);
            event.target.value = ''; // Reset input to allow re-uploading the same file
        }
    };
    
    return (
        <div className="mt-6">
            <div className="flex justify-end mb-6">
                <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 cursor-pointer">
                    <PlusIcon /> Thêm ảnh Tầm nhìn
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map(img => (
                    <div key={img.id} className="relative group overflow-hidden rounded-lg shadow-lg">
                        <img src={img.url} alt={img.caption} className="w-full h-full object-cover aspect-square" />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-opacity flex items-end justify-center p-4">
                            <p className="text-white text-center font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">{img.caption}</p>
                            <button onClick={() => onDelete(img.id)} className="absolute top-2 right-2 p-1.5 bg-red-600/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-500">
                                <DeleteIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const GoalForm: React.FC<{
    onSave: (goal: Omit<LifeGoal, 'id' | 'actionSteps'> & { actionSteps: Omit<ActionStep, 'id' | 'isCompleted'>[] }) => Promise<void>;
    existingGoal: LifeGoal | null;
    onClose: () => void;
}> = ({ onSave, existingGoal, onClose }) => {
    const [formData, setFormData] = useState(existingGoal || {
        category: GoalCategory.CAREER, title: '', targetDate: '', actionSteps: [{ id: `temp_${Date.now()}`, text: '', isCompleted: false }],
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleActionStepChange = (index: number, text: string) => {
        const newSteps = formData.actionSteps.map((step, i) => i === index ? { ...step, text } : step);
        setFormData({ ...formData, actionSteps: newSteps });
    };

    const addActionStep = () => {
        setFormData({ ...formData, actionSteps: [...formData.actionSteps, { id: `temp_${Date.now()}`, text: '', isCompleted: false }] });
    };
    
    const removeActionStep = (index: number) => {
        const newSteps = formData.actionSteps.filter((_, i) => i !== index);
        setFormData({ ...formData, actionSteps: newSteps });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave({ ...formData, actionSteps: formData.actionSteps.map(({ text }) => ({ text })) });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tiêu đề Mục tiêu</label>
                <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-gray-700 text-white rounded-md p-2" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Lĩnh vực</label>
                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as GoalCategory })} className="w-full bg-gray-700 text-white rounded-md p-2" required>
                    {Object.values(GoalCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Ngày hoàn thành (tùy chọn)</label>
                <input type="date" value={formData.targetDate || ''} onChange={e => setFormData({ ...formData, targetDate: e.target.value })} className="w-full bg-gray-700 text-white rounded-md p-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Các bước thực hiện</label>
                <div className="space-y-2">
                    {formData.actionSteps.map((step, index) => (
                        <div key={step.id} className="flex items-center gap-2">
                            <input type="text" value={step.text} onChange={e => handleActionStepChange(index, e.target.value)} placeholder={`Bước ${index + 1}`} className="flex-grow bg-gray-600 text-white rounded-md p-2 text-sm" />
                             <button type="button" onClick={() => removeActionStep(index)} className="text-red-500 hover:text-red-400 p-1 rounded-full bg-gray-700"><DeleteIcon className="w-4 h-4" /></button>
                        </div>
                    ))}
                </div>
                 <button type="button" onClick={addActionStep} className="text-sm text-blue-400 hover:underline mt-2">Thêm bước</button>
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500">Hủy</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-500 text-white font-semibold disabled:bg-blue-800 disabled:cursor-not-allowed">
                    {isSaving ? 'Đang lưu...' : 'Lưu'}
                </button>
            </div>
        </form>
    );
};


// --- Main Page Component ---
const LifeGoals: React.FC = () => {
    const { getUserData, updateUserData, currentUser } = useAuth();
    const [goals, setGoals] = useState<LifeGoal[]>([]);
    const [visions, setVisions] = useState<VisionBoardImage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'goals' | 'vision'>('goals');

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getUserData();
            setGoals(data.lifeGoals?.goals || []);
            setVisions(data.lifeGoals?.visions || []);
        } catch (err) {
            console.error("Failed to fetch life goals:", err);
            setError("Không thể tải dữ liệu mục tiêu. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    }, [getUserData]);

    useEffect(() => {
        if(currentUser) {
            fetchData();
        }
    }, [currentUser, fetchData]);

    const updateLifeGoalsData = async (updatedData: { goals?: LifeGoal[], visions?: VisionBoardImage[] }) => {
        const currentData = { goals, visions };
        const newData = { ...currentData, ...updatedData };
        if (updatedData.goals) setGoals(updatedData.goals);
        if (updatedData.visions) setVisions(updatedData.visions);
        await updateUserData({ lifeGoals: newData });
    };

    const handleSaveGoal = async (goalData: Omit<LifeGoal, 'id' | 'actionSteps'> & { actionSteps: Omit<ActionStep, 'id' | 'isCompleted'>[] }, existingId?: string) => {
        let updatedGoals;
        if (existingId) {
            const existingGoal = goals.find(g => g.id === existingId);
            updatedGoals = goals.map(g => g.id === existingId ? {
                ...existingGoal,
                ...goalData,
                id: existingId,
                actionSteps: goalData.actionSteps.map((step, index) => ({
                    ...step,
                    id: existingGoal?.actionSteps[index]?.id || `s${Date.now()}${index}`,
                    isCompleted: existingGoal?.actionSteps[index]?.isCompleted || false
                }))
            } as LifeGoal : g);
        } else {
            const newGoal: LifeGoal = {
                ...goalData,
                id: `g${Date.now()}`,
                actionSteps: goalData.actionSteps.map((step, index) => ({ ...step, id: `s${Date.now()}${index}`, isCompleted: false })),
            };
            updatedGoals = [...goals, newGoal];
        }
        await updateLifeGoalsData({ goals: updatedGoals });
    };

    const handleDeleteGoal = (id: string) => updateLifeGoalsData({ goals: goals.filter(g => g.id !== id) });

    const handleToggleActionStep = (goalId: string, stepId: string) => {
        const updatedGoals = goals.map(goal => {
            if (goal.id === goalId) {
                return {
                    ...goal,
                    actionSteps: goal.actionSteps.map(step =>
                        step.id === stepId ? { ...step, isCompleted: !step.isCompleted } : step
                    )
                };
            }
            return goal;
        });
        updateLifeGoalsData({ goals: updatedGoals });
    };

    const handleAddVision = (url: string, caption: string) => {
        const newImage: VisionBoardImage = { id: `v${Date.now()}`, url, caption };
        updateLifeGoalsData({ visions: [newImage, ...visions] });
    };

    const handleDeleteVision = (id: string) => updateLifeGoalsData({ visions: visions.filter(img => img.id !== id) });

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
            case 'goals': return <GoalSetting goals={goals} onSave={handleSaveGoal} onDelete={handleDeleteGoal} onToggleStep={handleToggleActionStep} />;
            case 'vision': return <VisionBoard images={visions} onAdd={handleAddVision} onDelete={handleDeleteVision} />;
            default: return null;
        }
    };

    return (
        <div>
            <PageHeader title="Mục tiêu Cuộc sống" subtitle="Vạch ra con đường, kiến tạo tương lai và sống một cuộc đời có chủ đích." />

             <div className="flex space-x-2 border-b border-gray-700 pb-2 mb-4">
                <TabButton active={activeTab === 'goals'} onClick={() => setActiveTab('goals')}>Thiết lập Mục tiêu</TabButton>
                <TabButton active={activeTab === 'vision'} onClick={() => setActiveTab('vision')}>Bảng Tầm nhìn</TabButton>
            </div>

            {renderContent()}
        </div>
    );
};

export default LifeGoals;