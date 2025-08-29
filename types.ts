export enum Page {
    DASHBOARD = "Tổng quan",
    DOCUMENTS = "Giấy tờ",
    LIFE_ASSISTANT = "Trợ lý Cuộc sống",
    VEHICLE_LOG = "Sổ tay Sức khỏe Xe",
    SPEED_WARNING = "Cảnh báo Tốc độ",
    PROFILE = "Tài khoản của tôi",
    SETTINGS = "Cài đặt",
}

export enum DocumentType {
    REGISTRATION = "Đăng kiểm",
    INSURANCE = "Bảo hiểm TNDS",
    ROAD_FEE = "Phí đường bộ",
    LICENSE = "Bằng lái xe",
}

export interface VehicleDocument {
    id: string;
    type: DocumentType;
    expiryDate: string;
    notes?: string;
    image?: string;
}

export enum ReminderType {
    BIRTHDAY = "Sinh nhật",
    ANNIVERSARY = "Ngày giỗ",
    TODO = "Việc cần làm",
    GOAL = "Mục tiêu",
}

export interface PersonalReminder {
    id: string;
    type: ReminderType;
    title: string;
    date: string;
    notes?: string;
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
