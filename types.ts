// types.ts

export interface User {
    uid: string;
    email: string;
    displayName?: string; // Tên hiển thị công khai
    photoURL?: string; // URL ảnh đại diện
    role: 'user' | 'admin';
    isActive: boolean;
    familyId?: string; // ID of the family document in the 'families' collection
    subscriptionTier?: 'free' | 'pro'; // Gói cước của người dùng
    expiryDate?: string; // Ngày hết hạn, định dạng YYYY-MM-DD
}

export enum Page {
    DASHBOARD = "Tổng quan",
    DOCUMENTS = "Giấy tờ",
    EVENT_CALENDAR = "Lịch Sự kiện",
    FINANCIAL_MANAGEMENT = "Quản lý Tài chính",
    HAPPY_FAMILY = "Gia đình Hạnh phúc",
    COMMUNITY = "Cộng đồng",
    SELF_DEVELOPMENT = "Phát triển Bản thân",
    LIFE_GOALS = "Mục tiêu Cuộc sống",
    VEHICLE_LOG = "Sổ tay Sức khỏe Xe",
    SPEED_WARNING = "Cảnh báo Tốc độ",
    PROFILE = "Tài khoản của tôi",
    SETTINGS = "Cài đặt",
    ADMIN = "Quản trị",
}

export enum DocumentType {
    // Giấy tờ xe
    REGISTRATION = "Đăng kiểm",
    INSURANCE = "Bảo hiểm TNDS",
    ROAD_FEE = "Phí đường bộ",
    LICENSE = "Bằng lái xe",

    // Giấy tờ cá nhân
    ID_CARD = "Căn cước công dân / CMND",
    PASSPORT = "Hộ chiếu",
    HEALTH_INSURANCE_CARD = "Thẻ Bảo hiểm Y tế",
    VISA = "Visa (Thị thực)",

    // Tài chính & Thẻ
    BANK_CARD = "Thẻ Ngân hàng",
    LIFE_INSURANCE = "Bảo hiểm Nhân thọ / Sức khỏe",

    // Khác
    PROFESSIONAL_CERTIFICATE = "Chứng chỉ nghề nghiệp",
    MEMBERSHIP_CARD = "Thẻ thành viên",
    OTHER = "Giấy tờ khác",
}

export interface VehicleDocument {
    id: string;
    type: DocumentType;
    expiryDate: string;
    notes?: string;
    image?: string;
    reminderSettings?: number[]; // e.g., [1, 3, 7] for 1, 3, 7 days before
}

export enum ReminderType {
    BIRTHDAY = "Sinh nhật",
    ANNIVERSARY = "Ngày giỗ",
    EVENT = "Sự kiện / Lời mời",
    TODO = "Việc cần làm",
}

export enum EventGroup {
    FAMILY = "Gia đình",
    FRIENDS = "Bạn bè",
    WORK = "Công việc",
    PERSONAL = "Cá nhân",
}

export type RepeatFrequency = 'none' | 'monthly' | 'quarterly' | 'yearly';

export interface PersonalReminder {
    id: string;
    group: EventGroup;
    type: ReminderType;
    title: string;
    date: string; // Ngày gốc của sự kiện
    time?: string; // Giờ gốc của sự kiện (HH:mm), không bắt buộc
    notes?: string;
    image?: string;
    calendarType?: 'solar' | 'lunar';
    reminderSettings?: number[]; // e.g., [0, 1, 3] for on the day, 1 day before, 3 days before
    repeat?: RepeatFrequency;
}

export interface VehicleLogEntry {
    id: string;
    date: string;
    mileage: number;
    service: string;
    cost: number;
    notes?: string;
    invoiceImage?: string;
}

// Types for Self Development features
export interface GratitudeEntry {
    id: string;
    date: string;
    content: string[]; // Array of things to be grateful for
}

export interface GoodDeed {
    id: string;
    date: string;
    content: string;
}

// Key for referencing a habit icon component. Stored in DB instead of React element.
export type HabitIconKey = 'BookOpenIcon' | 'SparklesIcon' | 'HeartIcon';

export interface Habit {
    id:string;
    name: string;
    icon: HabitIconKey;
    color: string;
}

// Key is date string 'YYYY-MM-DD', value is array of completed habit IDs
export type HabitLog = Record<string, string[]>;

// Types for Life Goals features
export enum GoalCategory {
    CAREER = "Sự nghiệp & Tài chính",
    HEALTH = "Sức khỏe",
    RELATIONSHIPS = "Gia đình & Mối quan hệ",
    PERSONAL_GROWTH = "Phát triển Cá nhân",
    CONTRIBUTION = "Cống hiến & Cho đi",
}

export interface ActionStep {
    id: string;
    text: string;
    isCompleted: boolean;
}

export interface LifeGoal {
    id: string;
    category: GoalCategory;
    title: string;
    description?: string;
    targetDate?: string;
    image?: string;
    actionSteps: ActionStep[];
}

export interface VisionBoardImage {
    id: string;
    url: string;
    caption?: string;
}

// --- Types for Financial Management ---
export enum TransactionType {
    INCOME = 'income',
    EXPENSE = 'expense',
}

export enum IncomeCategory {
    SALARY = 'Lương',
    BONUS = 'Thưởng & Hoa hồng',
    SIDE_INCOME = 'Thu nhập phụ',
    GIFT = 'Được tặng, cho',
    INVESTMENT = 'Lãi & Đầu tư',
    OTHER = 'Thu nhập khác',
}

export enum ExpenseCategory {
    FOOD = 'Ăn uống',
    LIVING = 'Nhà cửa & Sinh hoạt',
    TRANSPORT = 'Đi lại',
    CHILDREN = 'Con cái & Học tập',
    HEALTH = 'Chăm sóc Bản thân',
    ENTERTAINMENT = 'Hưởng thụ & Giải trí',
    SOCIAL = 'Phát triển & Giao tế',
    FINANCE = 'Tài chính & Hóa đơn',
    OTHER = 'Chi phí khác',
}

export interface Transaction {
    id: string;
    type: TransactionType;
    category: IncomeCategory | ExpenseCategory;
    amount: number;
    date: string; // YYYY-MM-DD
    notes?: string;
}

export enum AssetCategory {
    SAVINGS = 'Tiết kiệm & Tiền mặt',
    INVESTMENTS = 'Đầu tư',
    REAL_ESTATE = 'Bất động sản',
    VEHICLE = 'Xe cộ',
    OTHER = 'Tài sản khác',
}

export interface Asset {
    id: string;
    name: string;
    category: AssetCategory;
    value: number;
    notes?: string;
}

export enum DebtCategory {
    LOAN = 'Vay ngân hàng',
    CREDIT_CARD = 'Thẻ tín dụng',
    PERSONAL = 'Vay cá nhân',
    MORTGAGE = 'Vay thế chấp',
    OTHER = 'Nợ khác',
}

export interface Debt {
    id: string;
    name: string;
    category: DebtCategory;
    totalAmount: number;
    amountPaid: number;
    interestRate?: number; // Optional interest rate
    dueDate?: string; // Optional due date
}

export enum InvestmentCategory {
    STOCKS = 'Cổ phiếu',
    CRYPTO = 'Tiền điện tử',
    BONDS = 'Trái phiếu',
    FUNDS = 'Quỹ đầu tư',
    GOLD = 'Vàng',
    OTHER = 'Đầu tư khác',
}

export interface Investment {
    id: string;
    name: string;
    category: InvestmentCategory;
    initialValue: number;
    currentValue: number;
    purchaseDate?: string;
}

// --- Types for Happy Family feature ---
export const Subjects = [
    'Toán', 'Văn', 'Tiếng Việt', 'Tiếng Anh', 'Năng Khiếu', 'Thể Dục', 'Đạo Đức'
] as const;
export type Subject = typeof Subjects[number];

export interface FamilyMember {
    id: string;
    name: string;
    uid?: string; // Link to the user's auth ID if they have an account
    avatar?: string;
}

export interface TaskStep {
    id: string;
    text: string;
    isCompleted: boolean;
}

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in_progress' | 'needs_help' | 'overdue' | 'completed';

export interface FamilyTask {
    id: string;
    title: string;
    assigneeId: string; // ID of FamilyMember
    deadline: string; // YYYY-MM-DDTHH:mm
    originalDeadline?: string; // Store original deadline to enforce one-time edit rule
    priority: TaskPriority;
    status: TaskStatus;
    steps: TaskStep[];
    createdAt?: any; // Firestore timestamp
}

export interface ChildAchievement {
    id: string;
    childId: string; // ID of FamilyMember
    subject: string;
    score: number;
    date: string; // YYYY-MM-DD
}

export interface ChecklistItem {
    id: string;
    text: string;
}

// Key is date 'YYYY-MM-DD', value is an array of completed item IDs.
export type DailyChecklistLog = Record<string, string[]>;

export interface HappyFamilyData {
    members: FamilyMember[];
    tasks: FamilyTask[];
    achievements: ChildAchievement[];
    defaultChecklistItems: ChecklistItem[]; // The master/template list of items
    customChecklists: Record<string, ChecklistItem[]>; // Key is childId, value is their personalized list
    checklistLogs: Record<string, DailyChecklistLog>; // Key is childId
    checklistRewardConfig?: {
        targetPoints: number;
        reward: string;
    };
    taskRewardConfig?: {
        targetRate: number;
        reward: string;
    };
    achievementRewardConfig?: {
        targetScore: number;
        targetCount: number;
        reward: string;
    };
}

// --- Types for Community Feature ---
export interface CommunityPost {
    id: string;
    authorId: string;
    authorDisplayName: string;
    authorPhotoURL: string | null;
    content: string[];
    createdAt: any; // Firestore timestamp
    likes: string[]; // Array of UIDs
    commentCount: number;
}

export interface PostComment {
    id: string;
    authorId: string;
    authorDisplayName: string;
    authorPhotoURL: string | null;
    text: string;
    createdAt: any; // Firestore timestamp
    likes: string[]; // Array of UIDs who liked the comment
}


// Type for all data associated with a user
export interface UserData {
    documents: VehicleDocument[];
    events: PersonalReminder[];
    vehicleLog: VehicleLogEntry[];
    selfDevelopment: {
        gratitude: GratitudeEntry[];
        deeds: GoodDeed[];
        habits: Habit[];
        habitLog: HabitLog;
    };
    lifeGoals: {
        goals: LifeGoal[];
        visions: VisionBoardImage[];
    };
    financials: {
        transactions: Transaction[];
        assets: Asset[];
        debts: Debt[];
        investments: Investment[];
    };
    happyFamily?: HappyFamilyData;
}

// Type for family invitations
export interface FamilyInvitation {
    id: string;
    familyId: string;
    fromUserName: string;
    toEmail: string;
    status: 'pending' | 'accepted' | 'declined';
}