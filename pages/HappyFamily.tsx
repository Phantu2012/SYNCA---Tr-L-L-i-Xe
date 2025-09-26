import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PageHeader from '../components/PageHeader';
import { HappyFamilyData, FamilyMember, FamilyTask, ChildAchievement, ChecklistItem, TaskPriority, TaskStatus, Subjects, Page } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { PlusIcon, UsersIcon, ClipboardListIcon, AcademicCapIcon, CheckCircleIcon, EditIcon, DeleteIcon, UserAddIcon, ClockIcon, InfoIcon, FilterIcon } from '../components/Icons';
import Modal from '../components/Modal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { db, firebase } from '../services/firebase';


// ===================================
// HELPER COMPONENTS & DATA
// ===================================

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; icon: React.ReactNode }> = ({ active, onClick, children, icon }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
            active ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
        }`}
    >
        {icon}
        <span className="hidden sm:inline">{children}</span>
    </button>
);

const Section: React.FC<{ title: string; subtitle: string; children: React.ReactNode; actions?: React.ReactNode }> = ({ title, subtitle, children, actions }) => (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
            <div>
                <h3 className="text-xl font-bold text-white">{title}</h3>
                <p className="text-gray-400 text-sm mt-1">{subtitle}</p>
            </div>
            {actions && <div className="flex-shrink-0">{actions}</div>}
        </div>
        {children}
    </div>
);

const getMonday = (d: Date) => {
    d = new Date(d);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
};

const today = new Date();
const mondayThisWeek = getMonday(today);

// ===================================
// MAIN COMPONENT
// ===================================
const HappyFamily: React.FC<{ clearNotification: (page: Page) => void }> = ({ clearNotification }) => {
    const { getFamilyData, updateFamilyData, currentUser } = useAuth();
    const [data, setData] = useState<HappyFamilyData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'checklist' | 'tasks' | 'achievements'>('checklist');
    
    // UI states
    const [isMembersExpanded, setMembersExpanded] = useState(false);

    // Modal states
    const [isMemberModalOpen, setMemberModalOpen] = useState(false);
    const [isTaskModalOpen, setTaskModalOpen] = useState(false);
    const [isAchievementModalOpen, setAchievementModalOpen] = useState(false);
    const [isInviteModalOpen, setInviteModalOpen] = useState(false);
    const [inviteConfirmation, setInviteConfirmation] = useState<{ email: string; show: boolean }>({ email: '', show: false });
    const [isTaskRewardModalOpen, setTaskRewardModalOpen] = useState(false);
    const [isChecklistRewardModalOpen, setChecklistRewardModalOpen] = useState(false);
    const [isAchievementRewardModalOpen, setAchievementRewardModalOpen] = useState(false);
    const [isChecklistManageModalOpen, setChecklistManageModalOpen] = useState(false);
    const [isAchievementReportModalOpen, setAchievementReportModalOpen] = useState(false);
    
    // Editing states
    const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
    const [editingTask, setEditingTask] = useState<FamilyTask | null>(null);
    const [editingAchievement, setEditingAchievement] = useState<ChildAchievement | null>(null);

    // Deletion confirmation states
    const [memberToDelete, setMemberToDelete] = useState<FamilyMember | null>(null);
    const [taskToDelete, setTaskToDelete] = useState<FamilyTask | null>(null);
    const [achievementToDelete, setAchievementToDelete] = useState<ChildAchievement | null>(null);

    useEffect(() => {
        clearNotification(Page.HAPPY_FAMILY);
    }, [clearNotification]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const familyData = await getFamilyData();
            setData(familyData);
        } catch (err) {
            console.error("Failed to fetch family data:", err);
            setError("Không thể tải dữ liệu gia đình. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    }, [getFamilyData]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const updateFamilyDataOptimistic = async (updatedData: Partial<HappyFamilyData>) => {
        if (!data) return;
        const originalData = data;
        const newData = { ...data, ...updatedData };
        setData(newData); // Optimistic UI update
        try {
            await updateFamilyData(newData);
        } catch (error) {
            console.error("Failed to update family data:", error);
            setData(originalData); // Revert on failure
            setError("Lưu thất bại, vui lòng thử lại.");
        }
    };

    // --- Member Management ---
    const handleSaveMember = async (name: string) => {
        if (!data) return;
        let updatedMembers;
        if (editingMember) {
             updatedMembers = data.members.map(m => m.id === editingMember.id ? { ...m, name } : m)
        } else {
            updatedMembers = [...data.members, { id: Date.now().toString(), name }];
        }
        await updateFamilyDataOptimistic({ members: updatedMembers });
        setMemberModalOpen(false);
        setEditingMember(null);
    };

    const handleSendInvite = async (email: string) => {
        if (!currentUser || !currentUser.familyId) {
            setError("Không thể gửi lời mời. Vui lòng thử lại.");
            return;
        }

        const newInvitation = {
            familyId: currentUser.familyId,
            fromUserName: currentUser.email,
            toEmail: email.toLowerCase().trim(),
            status: 'pending'
        };

        try {
            await db.collection('invitations').add(newInvitation);
            setInviteModalOpen(false);
            setTimeout(() => {
                setInviteConfirmation({ email, show: true });
            }, 300);
        } catch (error) {
            console.error("Error sending invitation:", error);
            setError("Gửi lời mời thất bại. Vui lòng kiểm tra lại và thử lại.");
        }
    };
    
    const handleConfirmDeleteMember = async () => {
        if (!data || !memberToDelete) return;
        const updatedMembers = data.members.filter(m => m.id !== memberToDelete.id);
        await updateFamilyDataOptimistic({ members: updatedMembers });
        setMemberToDelete(null);
    };

    // --- Task Management ---
    const sortedTasks = useMemo(() => {
        if (!data?.tasks) return [];
        return [...data.tasks].sort((a, b) => {
            if (a.status === 'completed' && b.status !== 'completed') return 1;
            if (a.status !== 'completed' && b.status === 'completed') return -1;
            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        });
    }, [data?.tasks]);
    
    const taskCompletionRate = useMemo(() => {
        if (!data?.tasks || data.tasks.length === 0) return 0;
        const completedOnTime = data.tasks.filter(t => t.status === 'completed').length;
        return (completedOnTime / data.tasks.length) * 100;
    }, [data?.tasks]);
    
    const handleSaveTask = async (taskData: Omit<FamilyTask, 'id' | 'createdAt'>) => {
        if (!data) return;
        const updatedTasks = editingTask
            ? data.tasks.map(t => t.id === editingTask.id ? { ...taskData, id: editingTask.id, originalDeadline: t.originalDeadline || t.deadline } : t)
            : [...data.tasks, { ...taskData, id: Date.now().toString(), createdAt: firebase.firestore.FieldValue.serverTimestamp() }];
        await updateFamilyDataOptimistic({ tasks: updatedTasks });
        setTaskModalOpen(false);
        setEditingTask(null);
    };

    const handleConfirmDeleteTask = async () => {
        if (!data || !taskToDelete) return;
        const updatedTasks = data.tasks.filter(t => t.id !== taskToDelete.id);
        await updateFamilyDataOptimistic({ tasks: updatedTasks });
        setTaskToDelete(null);
    };

    const handleToggleTaskStep = async (taskId: string, stepId: string) => {
        if (!data) return;
        const updatedTasks = data.tasks.map(t => t.id === taskId ? { ...t, steps: t.steps.map(s => s.id === stepId ? { ...s, isCompleted: !s.isCompleted } : s) } : t);
        await updateFamilyDataOptimistic({ tasks: updatedTasks });
    };
    
    const handleToggleTaskCompletion = async (taskId: string) => {
        if (!data) return;
        const updatedTasks = data.tasks.map(t => {
            if (t.id === taskId) {
                const newStatus: TaskStatus = t.status === 'completed' ? 'pending' : 'completed';
                return { ...t, status: newStatus };
            }
            return t;
        });
        await updateFamilyDataOptimistic({ tasks: updatedTasks });
    };

    const handleSaveTaskReward = async (config: { targetRate: number, reward: string }) => {
        await updateFamilyDataOptimistic({ taskRewardConfig: config });
        setTaskRewardModalOpen(false);
    };

    // --- Achievement Management ---
    const achievementsThisWeek = useMemo(() => {
        if (!data?.achievements) return [];
        return data.achievements.filter(a => new Date(a.date) >= mondayThisWeek);
    }, [data?.achievements]);
    
    const weeklyRewardWinners = useMemo(() => {
        if (!data?.achievementRewardConfig) return [];
        const { targetScore, targetCount } = data.achievementRewardConfig;
        const scoreCounts: Record<string, number> = {};
        achievementsThisWeek.forEach(a => {
            if (a.score === targetScore) {
                scoreCounts[a.childId] = (scoreCounts[a.childId] || 0) + 1;
            }
        });
        return Object.keys(scoreCounts).filter(childId => scoreCounts[childId] >= targetCount);
    }, [achievementsThisWeek, data?.achievementRewardConfig]);

    const handleSaveAchievement = async (achievementData: Omit<ChildAchievement, 'id'>) => {
        if (!data) return;
        const updatedAchievements = editingAchievement
            ? data.achievements.map(a => a.id === editingAchievement.id ? { ...achievementData, id: editingAchievement.id } : a)
            : [...data.achievements, { ...achievementData, id: Date.now().toString() }];
        await updateFamilyDataOptimistic({ achievements: updatedAchievements });
        setAchievementModalOpen(false);
        setEditingAchievement(null);
    };
    
    const handleConfirmDeleteAchievement = async () => {
        if (!data || !achievementToDelete) return;
        const updatedAchievements = data.achievements.filter(a => a.id !== achievementToDelete.id);
        await updateFamilyDataOptimistic({ achievements: updatedAchievements });
        setAchievementToDelete(null);
    };

    const handleSaveAchievementReward = async (config: { targetScore: number, targetCount: number, reward: string }) => {
        await updateFamilyDataOptimistic({ achievementRewardConfig: config });
        setAchievementRewardModalOpen(false);
    };

    // --- Checklist Management ---
    const handleUpdateChecklistItems = async (childId: string, items: ChecklistItem[]) => {
        if (!data) return;
        const newCustomChecklists = { ...data.customChecklists, [childId]: items };
        await updateFamilyDataOptimistic({ customChecklists: newCustomChecklists });
    };

    const handleToggleChecklistItem = async (childId: string, itemId: string, date: string) => {
        if (!data) return;
        const childLog = data.checklistLogs?.[childId] || {};
        const dayLog = childLog[date] || [];
        const newDayLog = dayLog.includes(itemId) ? dayLog.filter(id => id !== itemId) : [...dayLog, itemId];
        const newChildLog = { ...childLog, [date]: newDayLog };
        const newChecklistLogs = { ...data.checklistLogs, [childId]: newChildLog };
        await updateFamilyDataOptimistic({ checklistLogs: newChecklistLogs });
    };

    const handleSaveChecklistReward = async (config: { targetPoints: number, reward: string }) => {
        await updateFamilyDataOptimistic({ checklistRewardConfig: config });
        setChecklistRewardModalOpen(false);
    };
    
    // --- Render Logic ---
    const renderContent = () => {
        if (isLoading) return <div className="text-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div></div>;
        if (error) return <div className="text-center p-10 text-red-400">{error}</div>;
        if (!data) return null;

        const children = data.members.filter(m => m.name !== 'Bố' && m.name !== 'Mẹ');

        switch (activeTab) {
            case 'tasks':
                return <TasksTabComponent tasks={sortedTasks} members={data.members} onAddTask={() => { setEditingTask(null); setTaskModalOpen(true); }} onEditTask={(task) => { setEditingTask(task); setTaskModalOpen(true); }} onDeleteTask={(task) => setTaskToDelete(task)} onToggleStep={handleToggleTaskStep} onToggleCompletion={handleToggleTaskCompletion} completionRate={taskCompletionRate} rewardConfig={data.taskRewardConfig} onEditReward={() => setTaskRewardModalOpen(true)} />;
            case 'achievements':
                 return <AchievementsTabComponent achievements={data.achievements} members={data.members} winners={weeklyRewardWinners} rewardConfig={data.achievementRewardConfig} onAddAchievement={() => { setEditingAchievement(null); setAchievementModalOpen(true); }} onEditAchievement={(ach) => { setEditingAchievement(ach); setAchievementModalOpen(true); }} onDeleteAchievement={(ach) => setAchievementToDelete(ach)} onOpenReport={() => setAchievementReportModalOpen(true)} onEditReward={() => setAchievementRewardModalOpen(true)} />;
            case 'checklist':
                 return <ChecklistTabComponent members={children} defaultChecklistItems={data.defaultChecklistItems} customChecklists={data.customChecklists} checklistLogs={data.checklistLogs} rewardConfig={data.checklistRewardConfig} onManage={() => setChecklistManageModalOpen(true)} onToggleItem={handleToggleChecklistItem} onEditReward={() => setChecklistRewardModalOpen(true)} />;
            default: return null;
        }
    };

    return (
        <div>
            <PageHeader title="Gia Đình Hạnh phúc" subtitle="Không gian chung để gắn kết, chia sẻ và cùng nhau phát triển." />
            <div className="space-y-8">
                <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                        <div>
                            <div className="flex items-center gap-4">
                                <h3 className="text-xl font-bold text-white">Thành viên Gia đình</h3>
                                {data && data.members.length > 0 && (
                                     <button onClick={() => setMembersExpanded(!isMembersExpanded)} className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                        <span>{isMembersExpanded ? 'Thu gọn' : `Xem tất cả (${data.members.length})`}</span>
                                         <svg className={`w-4 h-4 transition-transform duration-300 ${isMembersExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </button>
                                )}
                            </div>
                             <p className="text-gray-400 text-sm mt-1">Khai báo các thành viên trong gia đình bạn.</p>
                        </div>
                        <div className="flex-shrink-0 flex gap-2">
                             <button onClick={() => { setEditingMember(null); setMemberModalOpen(true); }} className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700"><PlusIcon className="w-5 h-5"/> Thêm</button>
                             <button onClick={() => setInviteModalOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-500"><UserAddIcon /> Mời</button>
                        </div>
                    </div>
                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isMembersExpanded ? 'max-h-[500px]' : 'max-h-0'}`}>
                         <div className="flex flex-wrap gap-4 pt-2">
                            {data?.members.map(member => (
                                <div key={member.id} className="bg-gray-700 p-2 pr-3 rounded-full flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white">{member.name.charAt(0)}</span>
                                    <span className="font-medium text-gray-200">{member.name}</span>
                                    <button onClick={() => { setEditingMember(member); setMemberModalOpen(true); }} className="text-gray-400 hover:text-white"><EditIcon className="w-4 h-4"/></button>
                                    <button onClick={() => setMemberToDelete(member)} className="text-gray-400 hover:text-red-500"><DeleteIcon className="w-4 h-4"/></button>
                                </div>
                            ))}
                             {data?.members.length === 0 && !isLoading && <p className="text-gray-500 italic">Chưa có thành viên nào.</p>}
                        </div>
                    </div>
                </div>

                <div className="flex space-x-1 sm:space-x-2 border-b border-gray-700 pb-2 mb-4 overflow-x-auto">
                    <TabButton active={activeTab === 'checklist'} onClick={() => setActiveTab('checklist')} icon={<CheckCircleIcon className="w-5 h-5"/>}>Checklist Hằng ngày</TabButton>
                    <TabButton active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} icon={<ClipboardListIcon className="w-5 h-5"/>}>Việc cần làm</TabButton>
                    <TabButton active={activeTab === 'achievements'} onClick={() => setActiveTab('achievements')} icon={<AcademicCapIcon className="w-5 h-5"/>}>Thành tích</TabButton>
                </div>
                {renderContent()}
            </div>
            
            {/* All Modals */}
            <Modal isOpen={isMemberModalOpen} onClose={() => setMemberModalOpen(false)} title={editingMember ? "Sửa tên Thành viên" : "Thêm Thành viên"}>
                <MemberForm onSave={handleSaveMember} existingName={editingMember?.name} onClose={() => setMemberModalOpen(false)}/>
            </Modal>
             <InviteMemberForm isOpen={isInviteModalOpen} onClose={() => setInviteModalOpen(false)} onInvite={handleSendInvite} />
             <Modal isOpen={inviteConfirmation.show} onClose={() => setInviteConfirmation({ email: '', show: false })} title="Lời mời đã được gửi">
                <div>
                    <p className="text-gray-300">
                        Một lời mời tham gia không gian gia đình đã được gửi đến <strong className="text-white">{inviteConfirmation.email}</strong>.
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                        Họ sẽ cần phải chấp nhận lời mời để xuất hiện trong danh sách thành viên.
                    </p>
                    <div className="flex justify-end mt-6">
                        <button
                            onClick={() => setInviteConfirmation({ email: '', show: false })}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
                        >
                            OK
                        </button>
                    </div>
                </div>
            </Modal>
             {isTaskRewardModalOpen && data && <TaskRewardForm isOpen={isTaskRewardModalOpen} onClose={() => setTaskRewardModalOpen(false)} config={data.taskRewardConfig || { targetRate: 80, reward: ''}} onSave={handleSaveTaskReward} />}
             {isChecklistManageModalOpen && data && <ManageChecklistForm isOpen={isChecklistManageModalOpen} onClose={() => setChecklistManageModalOpen(false)} members={data.members.filter(m => m.name !== 'Bố' && m.name !== 'Mẹ')} defaultItems={data.defaultChecklistItems} customItems={data.customChecklists} onSave={handleUpdateChecklistItems} />}
             {isTaskModalOpen && data && <TaskForm isOpen={isTaskModalOpen} onClose={() => setTaskModalOpen(false)} onSave={handleSaveTask} existingTask={editingTask} members={data.members} />}
             {isAchievementModalOpen && data && <AchievementForm isOpen={isAchievementModalOpen} onClose={() => setAchievementModalOpen(false)} onSave={handleSaveAchievement} existingAchievement={editingAchievement} members={data.members.filter(m => m.name !== 'Bố' && m.name !== 'Mẹ')} />}
             {isAchievementReportModalOpen && data && <AchievementReportModal isOpen={isAchievementReportModalOpen} onClose={() => setAchievementReportModalOpen(false)} achievements={data.achievements} members={data.members.filter(m => m.name !== 'Bố' && m.name !== 'Mẹ')} />}
             {isChecklistRewardModalOpen && data && <ChecklistRewardForm isOpen={isChecklistRewardModalOpen} onClose={() => setChecklistRewardModalOpen(false)} config={data.checklistRewardConfig || { targetPoints: 80, reward: ''}} onSave={handleSaveChecklistReward} />}
             {isAchievementRewardModalOpen && data && <AchievementRewardForm isOpen={isAchievementRewardModalOpen} onClose={() => setAchievementRewardModalOpen(false)} config={data.achievementRewardConfig || { targetScore: 10, targetCount: 2, reward: ''}} onSave={handleSaveAchievementReward} />}
            
            {/* Deletion Confirmation Modals */}
            <Modal isOpen={!!memberToDelete} onClose={() => setMemberToDelete(null)} title="Xác nhận Xóa Thành viên">
                <div>
                    <p className="text-gray-300">Bạn có chắc muốn xóa thành viên <strong className="text-white">{memberToDelete?.name}</strong>? Thao tác này sẽ xóa tất cả công việc và thành tích liên quan.</p>
                    <div className="flex justify-end gap-4 mt-6">
                        <button onClick={() => setMemberToDelete(null)} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Hủy</button>
                        <button onClick={handleConfirmDeleteMember} className="px-4 py-2 bg-red-600 rounded-md text-white font-semibold hover:bg-red-700">Xóa</button>
                    </div>
                </div>
            </Modal>
            <Modal isOpen={!!taskToDelete} onClose={() => setTaskToDelete(null)} title="Xác nhận Xóa Công việc">
                <div>
                    <p className="text-gray-300">Bạn có chắc muốn xóa công việc: <strong className="text-white">{taskToDelete?.title}</strong>?</p>
                    <div className="flex justify-end gap-4 mt-6">
                        <button onClick={() => setTaskToDelete(null)} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Hủy</button>
                        <button onClick={handleConfirmDeleteTask} className="px-4 py-2 bg-red-600 rounded-md text-white font-semibold hover:bg-red-700">Xóa</button>
                    </div>
                </div>
            </Modal>
            <Modal isOpen={!!achievementToDelete} onClose={() => setAchievementToDelete(null)} title="Xác nhận Xóa Thành tích">
                 <div>
                    <p className="text-gray-300">Bạn có chắc chắn muốn xóa thành tích này?</p>
                    <div className="flex justify-end gap-4 mt-6">
                        <button onClick={() => setAchievementToDelete(null)} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Hủy</button>
                        <button onClick={handleConfirmDeleteAchievement} className="px-4 py-2 bg-red-600 rounded-md text-white font-semibold hover:bg-red-700">Xóa</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};


// ===================================
// TASK MANAGEMENT COMPONENTS
// ===================================
interface TasksTabProps { tasks: FamilyTask[]; members: FamilyMember[]; onAddTask: () => void; onEditTask: (task: FamilyTask) => void; onDeleteTask: (task: FamilyTask) => void; onToggleStep: (taskId: string, stepId: string) => void; onToggleCompletion: (taskId: string) => void; completionRate: number; rewardConfig?: { targetRate: number, reward: string }; onEditReward: () => void; }
const TasksTabComponent: React.FC<TasksTabProps> = ({ tasks, members, onAddTask, onEditTask, onDeleteTask, onToggleStep, onToggleCompletion, completionRate, rewardConfig, onEditReward }) => {
    const getAssigneeName = (id: string) => members.find(m => m.id === id)?.name || 'N/A';
    const priorityMap: Record<TaskPriority, { text: string; color: string }> = { high: { text: 'Cao', color: 'bg-red-500' }, medium: { text: 'TB', color: 'bg-yellow-500' }, low: { text: 'Thấp', color: 'bg-gray-500' } };
    const statusMap: Record<TaskStatus, { text: string; color: string; icon: React.ReactNode }> = { pending: { text: 'Chờ làm', color: 'text-gray-300', icon: null }, needs_help: { text: 'Cần hỗ trợ', color: 'text-yellow-400', icon: <InfoIcon className="w-4 h-4" /> }, overdue: { text: 'Quá hạn', color: 'text-red-400', icon: <ClockIcon className="w-4 h-4" /> }, completed: { text: 'Hoàn thành', color: 'text-green-400', icon: <CheckCircleIcon className="w-4 h-4" /> } };

    return (
        <Section title="Công việc chung" subtitle="Phân công và theo dõi các công việc của cả gia đình." actions={<button onClick={onAddTask} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700"><PlusIcon /> Thêm Việc</button>}>
            <div className="mb-6 bg-gray-900/50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-gray-300">Tiến độ thưởng tuần (hoàn thành &gt; {rewardConfig?.targetRate || 80}%)</p>
                    <button onClick={onEditReward} className="text-xs text-blue-400 hover:underline">Chỉnh sửa</button>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4 relative overflow-hidden"><div className="bg-green-500 h-4 rounded-full transition-all duration-500" style={{ width: `${completionRate}%` }}></div><span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white mix-blend-difference">{completionRate.toFixed(0)}%</span></div>
                {rewardConfig && completionRate >= rewardConfig.targetRate && <p className="text-green-400 mt-2 text-sm font-semibold">🎉 Chúc mừng! Gia đình đã đạt mục tiêu tuần này. Phần thưởng là: "{rewardConfig.reward}"</p>}
            </div>
            <div className="space-y-4">
                {tasks.map(task => {
                    const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'completed';
                    const effectiveStatus = task.status === 'completed' ? 'completed' : isOverdue ? 'overdue' : task.status;
                    const assignee = members.find(m => m.id === task.assigneeId);
                    return (<div key={task.id} className={`p-4 rounded-lg bg-gray-900/50 transition-all ${task.status === 'completed' ? 'opacity-60' : ''}`}>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3"><input type="checkbox" checked={task.status === 'completed'} onChange={() => onToggleCompletion(task.id)} className="w-6 h-6 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-600 cursor-pointer flex-shrink-0 mt-1"/>
                                <div><p className={`font-bold text-lg ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-white'}`}>{task.title}</p>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mt-1 text-gray-400">
                                        <div className="flex items-center gap-1">{assignee && <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">{assignee.name.charAt(0)}</span>}<span>{getAssigneeName(task.assigneeId)}</span></div>
                                        <span className={`${isOverdue ? 'text-red-400 font-semibold' : 'text-gray-300'}`}>Hạn: {new Date(task.deadline).toLocaleDateString('vi-VN')}</span>
                                        <div className="flex items-center gap-1.5"><span className={`w-3 h-3 rounded-full ${priorityMap[task.priority].color}`}></span><span>Ưu tiên: {priorityMap[task.priority].text}</span></div>
                                        <div className={`flex items-center gap-1.5 font-semibold ${statusMap[effectiveStatus].color}`}>{statusMap[effectiveStatus].icon} {statusMap[effectiveStatus].text}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0"><button onClick={() => onEditTask(task)} className="text-gray-400 hover:text-white"><EditIcon/></button><button onClick={() => onDeleteTask(task)} className="text-gray-400 hover:text-red-500"><DeleteIcon/></button></div>
                        </div>
                        {task.steps.length > 0 && <div className="mt-3 ml-9 space-y-2 border-l-2 border-gray-700 pl-4">{task.steps.map(step => (<label key={step.id} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer"><input type="checkbox" checked={step.isCompleted} onChange={() => onToggleStep(task.id, step.id)} className="w-4 h-4 text-blue-500 bg-gray-800 border-gray-600 rounded focus:ring-blue-600"/><span className={step.isCompleted ? 'line-through text-gray-500' : ''}>{step.text}</span></label>))}</div>}
                    </div>)})}
                {tasks.length === 0 && <p className="text-center text-gray-500 py-4">Chưa có công việc nào.</p>}
            </div>
        </Section>
    );
};


// ===================================
// ACHIEVEMENT MANAGEMENT COMPONENTS
// ===================================
interface AchievementsTabProps { achievements: ChildAchievement[]; members: FamilyMember[]; winners: string[]; rewardConfig?: { targetScore: number, targetCount: number, reward: string }; onAddAchievement: () => void; onEditAchievement: (ach: ChildAchievement) => void; onDeleteAchievement: (ach: ChildAchievement) => void; onOpenReport: () => void; onEditReward: () => void; }
const AchievementsTabComponent: React.FC<AchievementsTabProps> = ({ achievements, members, winners, rewardConfig, onAddAchievement, onEditAchievement, onDeleteAchievement, onOpenReport, onEditReward }) => {
    const getChildName = (id: string) => members.find(m => m.id === id)?.name || 'N/A';
    return (
         <Section title="Thành tích của con" subtitle="Ghi lại và khen thưởng những điểm số tốt của các con." actions={
             <div className="flex gap-2"><button onClick={onOpenReport} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-500"><FilterIcon/> Báo cáo</button><button onClick={onAddAchievement} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700"><PlusIcon/> Thêm Điểm</button></div>
         }>
            <div className="mb-6 bg-yellow-900/50 p-4 rounded-lg border border-yellow-700">
                <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold text-yellow-300">Thưởng Tuần</p>
                    <button onClick={onEditReward} className="text-xs text-blue-400 hover:underline">Chỉnh sửa</button>
                </div>
                {rewardConfig ? (
                    winners.length > 0 ? (
                        <p className="text-yellow-200">🎉 Chúc mừng {winners.map(id => getChildName(id)).join(' và ')} đã đạt {rewardConfig.targetCount} điểm {rewardConfig.targetScore} trong tuần! Phần thưởng: {rewardConfig.reward}.</p>
                    ) : (
                        <p className="text-yellow-400/80 text-sm">Mục tiêu: Đạt {rewardConfig.targetCount} điểm {rewardConfig.targetScore} để nhận "{rewardConfig.reward}".</p>
                    )
                ) : (
                     <p className="text-yellow-400/80 text-sm">Chưa có phần thưởng nào được thiết lập. Hãy nhấn "Chỉnh sửa" để thêm.</p>
                )}
            </div>

             <div className="space-y-4">
                 {achievements.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(ach => (
                     <div key={ach.id} className="bg-gray-900/50 p-3 rounded-lg flex items-center justify-between">
                         <div className="flex items-center gap-3"><div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center font-bold text-white ${ach.score >= 8 ? 'bg-green-600' : ach.score >= 5 ? 'bg-yellow-600' : 'bg-red-600'}`}><span className="text-2xl">{ach.score}</span><span className="text-xs">điểm</span></div>
                             <div><p className="font-semibold text-white">Môn {ach.subject}</p><p className="text-sm text-gray-400">{getChildName(ach.childId)} - {new Date(ach.date).toLocaleDateString('vi-VN')}</p></div>
                         </div>
                         <div className="flex gap-2"><button onClick={() => onEditAchievement(ach)} className="text-gray-400 hover:text-white"><EditIcon/></button><button onClick={() => onDeleteAchievement(ach)} className="text-gray-400 hover:text-red-500"><DeleteIcon/></button></div>
                     </div>
                 ))}
                 {achievements.length === 0 && <p className="text-center text-gray-500 py-4">Chưa có thành tích nào.</p>}
             </div>
         </Section>
    );
};

// ===================================
// CHECKLIST MANAGEMENT COMPONENTS
// ===================================
interface ChecklistTabProps { members: FamilyMember[]; defaultChecklistItems: ChecklistItem[]; customChecklists: Record<string, ChecklistItem[]>; checklistLogs: Record<string, Record<string, string[]>>; rewardConfig?: { targetPoints: number; reward: string }; onManage: () => void; onToggleItem: (childId: string, itemId: string, date: string) => void; onEditReward: () => void; }
const ChecklistTabComponent: React.FC<ChecklistTabProps> = ({ members, defaultChecklistItems, customChecklists, checklistLogs, rewardConfig, onManage, onToggleItem, onEditReward }) => {
    const [selectedChildId, setSelectedChildId] = useState<string | null>(members[0]?.id || null);
    const [viewedDate, setViewedDate] = useState(new Date().toISOString().slice(0, 10));
    const todayStr = new Date().toISOString().slice(0, 10);

    const itemsForSelectedChild = useMemo(() => {
        return (selectedChildId && customChecklists[selectedChildId]) ? customChecklists[selectedChildId] : defaultChecklistItems;
    }, [selectedChildId, customChecklists, defaultChecklistItems]);
    
    const completedOnViewedDate = checklistLogs?.[selectedChildId || '']?.[viewedDate]?.length || 0;
    
    return (<Section title="Checklist Hằng ngày" subtitle="Giúp con xây dựng thói quen tốt mỗi ngày." actions={
        <div className="flex gap-2">
            <button onClick={onEditReward} className="px-3 py-2 text-sm bg-yellow-600 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-500">Phần thưởng</button>
            <button onClick={onManage} className="px-3 py-2 text-sm bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-500">Quản lý</button>
        </div>
    }>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <select onChange={e => setSelectedChildId(e.target.value)} value={selectedChildId || ''} className="bg-gray-700 text-white p-2 rounded-md w-full sm:flex-grow"><option value="">-- Chọn bé --</option>{members.map(m => <option key={m.id} value={m.id}>Xem checklist của {m.name}</option>)}</select>
            <div className="flex gap-2 items-center">
                 <input 
                    type="date" 
                    value={viewedDate} 
                    onChange={e => setViewedDate(e.target.value)} 
                    className="bg-gray-700 text-white p-2 rounded-md w-full"
                />
                <button 
                    onClick={() => setViewedDate(todayStr)} 
                    className="px-3 py-2 text-sm bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-500 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={viewedDate === todayStr}
                >
                    Hôm nay
                </button>
            </div>
        </div>
        {selectedChildId ? (<>
            <p className="mb-4 font-semibold text-gray-300">Ngày ({new Date(viewedDate).toLocaleDateString('vi-VN')}): Hoàn thành {completedOnViewedDate}/{itemsForSelectedChild.length}</p>
            <div className="space-y-3">{itemsForSelectedChild.map(item => {
                const isCompleted = checklistLogs?.[selectedChildId]?.[viewedDate]?.includes(item.id) || false;
                return <label key={item.id} className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg cursor-pointer hover:bg-gray-700"><input type="checkbox" checked={isCompleted} onChange={() => onToggleItem(selectedChildId, item.id, viewedDate)} className="w-5 h-5 text-blue-500 bg-gray-800 border-gray-600 rounded focus:ring-blue-600"/><span className={`transition-colors ${isCompleted ? 'line-through text-gray-500' : 'text-white'}`}>{item.text}</span></label>
            })}</div>
        </>) : <p className="text-gray-400">{members.length > 0 ? "Hãy chọn một bé để xem checklist." : "Hãy thêm thành viên (con) để bắt đầu sử dụng checklist."}</p>}
    </Section>)
}

// ===================================
// MODAL COMPONENTS
// ===================================
const MemberForm: React.FC<{ onSave: (name: string) => void, existingName?: string, onClose: () => void }> = ({ onSave, existingName, onClose }) => {
    const [name, setName] = useState(existingName || '');
    return (<form onSubmit={(e) => { e.preventDefault(); onSave(name); }} className="space-y-4">
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Tên thành viên" className="w-full bg-gray-700 text-white rounded-md p-2" required />
        <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md">Hủy</button><button type="submit" className="px-4 py-2 bg-blue-600 rounded-md text-white font-semibold">Lưu</button></div>
    </form>);
};

const InviteMemberForm: React.FC<{ isOpen: boolean; onClose: () => void; onInvite: (email: string) => void }> = ({ isOpen, onClose, onInvite }) => {
    const [email, setEmail] = useState('');
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onInvite(email); };
    return (<Modal isOpen={isOpen} onClose={onClose} title="Mời thành viên mới">
        <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-400">Thành viên được mời sẽ nhận được một email để tham gia vào không gian gia đình của bạn trên Synca.</p>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Nhập email thành viên" className="w-full bg-gray-700 p-2 rounded" required />
            <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded">Hủy</button><button type="submit" className="px-4 py-2 bg-blue-600 rounded text-white font-semibold">Gửi lời mời</button></div>
        </form>
    </Modal>);
};

interface TaskFormProps { isOpen: boolean; onClose: () => void; onSave: (task: Omit<FamilyTask, 'id' | 'createdAt'>) => Promise<void>; existingTask: FamilyTask | null; members: FamilyMember[];}
const TaskForm: React.FC<TaskFormProps> = ({ isOpen, onClose, onSave, existingTask, members }) => {
    const [formData, setFormData] = useState<Omit<FamilyTask, 'id' | 'createdAt'>>(existingTask || { title: '', assigneeId: '', deadline: '', priority: 'medium', status: 'pending', steps: [] });
    useEffect(() => {
        if (isOpen) {
            setFormData(existingTask || { title: '', assigneeId: members[0]?.id || '', deadline: new Date().toISOString().slice(0, 10), priority: 'medium', status: 'pending', steps: [] });
        }
    }, [isOpen, existingTask, members]);
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); };
    return (<Modal isOpen={isOpen} onClose={onClose} title={existingTask ? "Chỉnh sửa Công việc" : "Thêm Công việc mới"}>
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Tên công việc" className="w-full bg-gray-700 p-2 rounded" required/>
            <div className="grid grid-cols-2 gap-4">
                <select value={formData.assigneeId} onChange={e => setFormData({...formData, assigneeId: e.target.value})} className="w-full bg-gray-700 p-2 rounded" required><option value="">Giao cho...</option>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
                <input type="date" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} className="w-full bg-gray-700 p-2 rounded" required disabled={!!existingTask?.originalDeadline}/>
            </div>
             {!!existingTask?.originalDeadline && <p className="text-xs text-yellow-400">Hạn chót chỉ có thể sửa một lần duy nhất.</p>}
            <div className="grid grid-cols-2 gap-4">
                <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as TaskPriority})} className="w-full bg-gray-700 p-2 rounded"><option value="low">Ưu tiên: Thấp</option><option value="medium">Ưu tiên: Vừa</option><option value="high">Ưu tiên: Cao</option></select>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as TaskStatus})} className="w-full bg-gray-700 p-2 rounded"><option value="pending">Trạng thái: Chờ làm</option><option value="needs_help">Trạng thái: Cần hỗ trợ</option><option value="completed">Trạng thái: Hoàn thành</option></select>
            </div>
            <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded">Hủy</button><button type="submit" className="px-4 py-2 bg-blue-600 rounded text-white font-semibold">Lưu</button></div>
        </form>
    </Modal>);
};

interface AchievementFormProps { isOpen: boolean; onClose: () => void; onSave: (ach: Omit<ChildAchievement, 'id'>) => Promise<void>; existingAchievement: ChildAchievement | null; members: FamilyMember[];}
const AchievementForm: React.FC<AchievementFormProps> = ({ isOpen, onClose, onSave, existingAchievement, members }) => {
    const [formData, setFormData] = useState<Omit<ChildAchievement, 'id'>>(existingAchievement || { childId: '', subject: '', score: 10, date: new Date().toISOString().slice(0, 10) });
    useEffect(() => { if (isOpen) setFormData(existingAchievement || { childId: members[0]?.id || '', subject: '', score: 10, date: new Date().toISOString().slice(0, 10) }); }, [isOpen, existingAchievement, members]);
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); };
    return (<Modal isOpen={isOpen} onClose={onClose} title={existingAchievement ? "Sửa Thành tích" : "Thêm Thành tích"}>
        <form onSubmit={handleSubmit} className="space-y-4">
            <select value={formData.childId} onChange={e => setFormData({...formData, childId: e.target.value})} className="w-full bg-gray-700 p-2 rounded" required><option value="">Chọn con</option>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="subject-input" className="sr-only">Môn học</label>
                    <input id="subject-input" type="text" list="subjects-list" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} placeholder="Môn học" className="w-full bg-gray-700 p-2 rounded" required/>
                    <datalist id="subjects-list">
                        {Subjects.map(s => <option key={s} value={s} />)}
                        <option value="Tùy chọn"></option>
                    </datalist>
                </div>
                <input type="number" step="0.5" min="0" max="10" value={formData.score} onChange={e => setFormData({...formData, score: Number(e.target.value)})} placeholder="Điểm số" className="w-full bg-gray-700 p-2 rounded" required/>
            </div>
            <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-gray-700 p-2 rounded" required/>
            <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded">Hủy</button><button type="submit" className="px-4 py-2 bg-blue-600 rounded text-white font-semibold">Lưu</button></div>
        </form>
    </Modal>);
}

const DragHandleIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 cursor-grab active:cursor-grabbing" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

interface ManageChecklistFormProps { isOpen: boolean; onClose: () => void; members: FamilyMember[]; defaultItems: ChecklistItem[]; customItems: Record<string, ChecklistItem[]>; onSave: (childId: string, items: ChecklistItem[]) => void; }
const ManageChecklistForm: React.FC<ManageChecklistFormProps> = ({ isOpen, onClose, members, defaultItems, customItems, onSave }) => {
    const [selectedChildId, setSelectedChildId] = useState<string>(members[0]?.id || '');
    const [currentItems, setCurrentItems] = useState<ChecklistItem[]>([]);
    const [newItemText, setNewItemText] = useState('');
    
    // Drag and Drop State
    const [draggedItem, setDraggedItem] = useState<ChecklistItem | null>(null);
    const [dragOverItem, setDragOverItem] = useState<ChecklistItem | null>(null);

    useEffect(() => {
        if (selectedChildId) {
            setCurrentItems(customItems[selectedChildId] || defaultItems);
        }
    }, [selectedChildId, customItems, defaultItems]);

    const handleAddItem = () => { if(newItemText.trim()) { setCurrentItems([...currentItems, { id: Date.now().toString(), text: newItemText }]); setNewItemText(''); }};
    const handleDeleteItem = (id: string) => setCurrentItems(currentItems.filter(item => item.id !== id));
    const handleSave = () => { if(selectedChildId) { onSave(selectedChildId, currentItems); onClose(); }};
    const handleReset = () => setCurrentItems(defaultItems);

    // --- Drag and Drop Handlers ---
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: ChecklistItem) => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.style.opacity = '0.5';
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, item: ChecklistItem) => {
        e.preventDefault();
        if (draggedItem?.id !== item.id) {
            setDragOverItem(item);
        }
    };
    const handleDragLeave = () => setDragOverItem(null);
    const handleDrop = (targetItem: ChecklistItem) => {
        if (!draggedItem || draggedItem.id === targetItem.id) return;
        const newItems = [...currentItems];
        const draggedIndex = newItems.findIndex(i => i.id === draggedItem.id);
        const targetIndex = newItems.findIndex(i => i.id === targetItem.id);
        const [removed] = newItems.splice(draggedIndex, 1);
        newItems.splice(targetIndex, 0, removed);
        setCurrentItems(newItems);
    };
    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.style.opacity = '1';
        setDraggedItem(null);
        setDragOverItem(null);
    };

    return (<Modal isOpen={isOpen} onClose={onClose} title="Quản lý Checklist">
        <div className="space-y-4">
            <select value={selectedChildId} onChange={e => setSelectedChildId(e.target.value)} className="w-full bg-gray-700 p-2 rounded"><option value="">-- Chọn bé --</option>{members.map(m => <option key={m.id} value={m.id}>Chỉnh sửa cho {m.name}</option>)}</select>
            {selectedChildId && <>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                    {currentItems.map(item => <div key={item.id} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, item)}
                        onDragOver={(e) => handleDragOver(e, item)}
                        onDragLeave={handleDragLeave}
                        onDrop={() => handleDrop(item)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center justify-between bg-gray-700 p-2 rounded transition-all duration-200 ${dragOverItem?.id === item.id ? 'border-t-2 border-blue-500' : 'border-t-2 border-transparent'}`}
                    >
                        <div className="flex items-center gap-2">
                             <DragHandleIcon />
                            <span className="text-gray-200">{item.text}</span>
                        </div>
                        <button onClick={() => handleDeleteItem(item.id)} className="text-red-500 hover:text-red-400"><DeleteIcon className="w-5 h-5"/></button>
                    </div>)}
                </div>
                <div className="flex gap-2 pt-4 border-t border-gray-600"><input value={newItemText} onChange={e => setNewItemText(e.target.value)} placeholder="Thêm mục mới..." className="flex-grow bg-gray-600 p-2 rounded"/><button onClick={handleAddItem} className="px-4 py-2 bg-gray-500 rounded">Thêm</button></div>
                <div className="flex justify-between items-center pt-4">
                    <button type="button" onClick={handleReset} className="text-sm text-yellow-400 hover:underline">Khôi phục mặc định</button>
                    <div className="flex gap-3"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded">Hủy</button><button onClick={handleSave} className="px-4 py-2 bg-blue-600 rounded text-white font-semibold">Lưu</button></div>
                </div>
            </>}
        </div>
    </Modal>);
};

interface AchievementReportModalProps { isOpen: boolean; onClose: () => void; achievements: ChildAchievement[]; members: FamilyMember[]; }
const AchievementReportModal: React.FC<AchievementReportModalProps> = ({ isOpen, onClose, achievements, members }) => {
    const [period, setPeriod] = useState('month');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [selectedChildId, setSelectedChildId] = useState('all');
    const [selectedSubject, setSelectedSubject] = useState('all');
    
    const { chartData, averageScore } = useMemo(() => {
        const now = new Date();
        let startDate = new Date();
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        
        if (period === 'week') startDate = getMonday(now);
        else if (period === 'month') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        else if (period === 'custom' && customStart && customEnd) {
            startDate = new Date(customStart);
            endDate.setTime(new Date(customEnd).getTime() + 86400000 - 1); // include the whole end day
        }
        startDate.setHours(0,0,0,0);

        const filtered = achievements.filter(a => {
            const aDate = new Date(a.date);
            const dateMatch = aDate >= startDate && aDate <= endDate;
            const childMatch = selectedChildId === 'all' || a.childId === selectedChildId;
            const subjectMatch = selectedSubject === 'all' || a.subject === selectedSubject;
            return dateMatch && childMatch && subjectMatch;
        });

        const subjectScores: Record<string, { total: number, count: number }> = {};
        filtered.forEach(a => {
            if (!subjectScores[a.subject]) subjectScores[a.subject] = { total: 0, count: 0 };
            subjectScores[a.subject].total += a.score;
            subjectScores[a.subject].count += 1;
        });

        const chartData = Object.entries(subjectScores).map(([subject, data]) => ({
            subject,
            average: data.total / data.count
        }));
        
        const totalAverage = filtered.length > 0 ? filtered.reduce((sum, a) => sum + a.score, 0) / filtered.length : 0;
        
        return { chartData, averageScore: totalAverage };
    }, [achievements, period, customStart, customEnd, selectedChildId, selectedSubject]);
    
    return (<Modal isOpen={isOpen} onClose={onClose} title="Báo cáo Thành tích">
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2 p-2 bg-gray-700 rounded-lg"><button onClick={() => setPeriod('week')} className={`px-3 py-1.5 text-sm rounded-md ${period === 'week' ? 'bg-blue-600' : ''}`}>Tuần</button><button onClick={() => setPeriod('month')} className={`px-3 py-1.5 text-sm rounded-md ${period === 'month' ? 'bg-blue-600' : ''}`}>Tháng</button><button onClick={() => setPeriod('custom')} className={`px-3 py-1.5 text-sm rounded-md ${period === 'custom' ? 'bg-blue-600' : ''}`}>Tùy chọn</button></div>
            {period === 'custom' && <div className="flex gap-2"><input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-full bg-gray-600 p-2 rounded"/><input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-full bg-gray-600 p-2 rounded"/></div>}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <select value={selectedChildId} onChange={e => setSelectedChildId(e.target.value)} className="w-full bg-gray-700 p-2 rounded"><option value="all">Tất cả các con</option>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
                 <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="w-full bg-gray-700 p-2 rounded"><option value="all">Tất cả các môn</option>{Subjects.map(s => <option key={s} value={s}>{s}</option>)}</select>
            </div>

            <div className="text-center bg-gray-900/50 p-3 rounded-lg"><p className="text-gray-400">Điểm trung bình chung</p><p className="text-2xl font-bold text-blue-400">{averageScore.toFixed(2)}</p></div>
            
            <h4 className="font-semibold text-white pt-2">Điểm trung bình theo Môn học</h4>
            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="#4a5568" /><XAxis dataKey="subject" tick={{ fill: '#a0aec0' }} /><YAxis domain={[0, 10]} tick={{ fill: '#a0aec0' }} /><Tooltip contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }} formatter={(value: number) => value.toFixed(2)} />
                        <Bar dataKey="average" name="Điểm TB">
                            {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.average >= 8 ? '#48bb78' : entry.average >= 5 ? '#ecc94b' : '#f56565'} />))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            ) : <p className="text-center text-gray-500 py-4">Không có dữ liệu cho lựa chọn này.</p>}
            <div className="flex justify-end pt-4"><button onClick={onClose} className="px-4 py-2 bg-blue-600 rounded text-white font-semibold">Đóng</button></div>
        </div>
    </Modal>);
}

interface TaskRewardFormProps { isOpen: boolean; onClose: () => void; config: { targetRate: number, reward: string }; onSave: (config: { targetRate: number, reward: string }) => void; }
const TaskRewardForm: React.FC<TaskRewardFormProps> = ({ isOpen, onClose, config, onSave }) => {
    const [rate, setRate] = useState(config.targetRate);
    const [reward, setReward] = useState(config.reward);
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave({ targetRate: rate, reward }); };
    return (<Modal isOpen={isOpen} onClose={onClose} title="Tùy chỉnh Phần thưởng Công việc">
        <form onSubmit={handleSubmit} className="space-y-4">
            <div><label htmlFor="targetRate" className="block text-sm font-medium text-gray-300 mb-1">Mục tiêu hoàn thành (%)</label><input type="number" id="targetRate" value={rate} onChange={e => setRate(Number(e.target.value))} min="1" max="100" className="w-full bg-gray-700 p-2 rounded" /></div>
            <div><label htmlFor="rewardText" className="block text-sm font-medium text-gray-300 mb-1">Nội dung phần thưởng</label><textarea id="rewardText" value={reward} onChange={e => setReward(e.target.value)} rows={3} className="w-full bg-gray-700 p-2 rounded" /></div>
            <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded">Hủy</button><button type="submit" className="px-4 py-2 bg-blue-600 rounded text-white font-semibold">Lưu</button></div>
        </form>
    </Modal>);
};

interface ChecklistRewardFormProps { isOpen: boolean; onClose: () => void; config: { targetPoints: number; reward: string }; onSave: (config: { targetPoints: number; reward: string }) => void; }
const ChecklistRewardForm: React.FC<ChecklistRewardFormProps> = ({ isOpen, onClose, config, onSave }) => {
    const [points, setPoints] = useState(config?.targetPoints || 80);
    const [reward, setReward] = useState(config?.reward || '');
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave({ targetPoints: points, reward }); };
    return (<Modal isOpen={isOpen} onClose={onClose} title="Tùy chỉnh Phần thưởng Checklist">
        <form onSubmit={handleSubmit} className="space-y-4">
            <div><label htmlFor="targetPoints" className="block text-sm font-medium text-gray-300 mb-1">Mục tiêu hoàn thành (điểm)</label><input type="number" id="targetPoints" value={points} onChange={e => setPoints(Number(e.target.value))} min="1" className="w-full bg-gray-700 p-2 rounded" /></div>
            <div><label htmlFor="checklistReward" className="block text-sm font-medium text-gray-300 mb-1">Nội dung phần thưởng</label><textarea id="checklistReward" value={reward} onChange={e => setReward(e.target.value)} rows={3} className="w-full bg-gray-700 p-2 rounded" /></div>
            <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded">Hủy</button><button type="submit" className="px-4 py-2 bg-blue-600 rounded text-white font-semibold">Lưu</button></div>
        </form>
    </Modal>);
};

interface AchievementRewardFormProps { isOpen: boolean; onClose: () => void; config: { targetScore: number; targetCount: number; reward: string }; onSave: (config: { targetScore: number; targetCount: number; reward: string }) => void; }
const AchievementRewardForm: React.FC<AchievementRewardFormProps> = ({ isOpen, onClose, config, onSave }) => {
    const [score, setScore] = useState(config?.targetScore || 10);
    const [count, setCount] = useState(config?.targetCount || 2);
    const [reward, setReward] = useState(config?.reward || '');
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave({ targetScore: score, targetCount: count, reward }); };
    return (<Modal isOpen={isOpen} onClose={onClose} title="Tùy chỉnh Phần thưởng Thành tích">
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                 <div><label htmlFor="targetScore" className="block text-sm font-medium text-gray-300 mb-1">Điểm số mục tiêu</label><input type="number" id="targetScore" value={score} onChange={e => setScore(Number(e.target.value))} min="1" max="10" className="w-full bg-gray-700 p-2 rounded" /></div>
                 <div><label htmlFor="targetCount" className="block text-sm font-medium text-gray-300 mb-1">Số lần đạt</label><input type="number" id="targetCount" value={count} onChange={e => setCount(Number(e.target.value))} min="1" className="w-full bg-gray-700 p-2 rounded" /></div>
            </div>
            <div><label htmlFor="achievementReward" className="block text-sm font-medium text-gray-300 mb-1">Nội dung phần thưởng</label><textarea id="achievementReward" value={reward} onChange={e => setReward(e.target.value)} rows={3} className="w-full bg-gray-700 p-2 rounded" /></div>
            <div className="flex justify-end gap-3 pt-4"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded">Hủy</button><button type="submit" className="px-4 py-2 bg-blue-600 rounded text-white font-semibold">Lưu</button></div>
        </form>
    </Modal>);
};


export default HappyFamily;