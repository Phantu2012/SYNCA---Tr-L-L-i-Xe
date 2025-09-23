import { db } from './firebase';
// Fix: Removed incorrect v9 imports
// import { doc, getDoc } from 'firebase/firestore';

export interface DailyQuote {
    quote: string;
    author: string;
    analysis: string;
}

export const getDailyQuote = async (): Promise<DailyQuote | { error: string }> => {
    try {
        // Fix: Use v8 syntax to get document reference
        const docRef = db.collection('appConfig').doc('dailyMessage');
        // Fix: Use v8 syntax to get document snapshot
        const docSnap = await docRef.get();

        // Fix: Use v8 `exists` property instead of `exists()` method
        if (docSnap.exists) {
            const data = docSnap.data();
            // Basic validation to ensure all fields are present
            if (data && data.quote && data.author && data.analysis) {
                return data as DailyQuote;
            }
        }
        
        // Return a default message if not set by admin yet
        return {
            quote: "Chào mừng đến với Synca! Hãy bắt đầu một ngày mới tràn đầy năng lượng.",
            author: "Synca Team",
            analysis: "Thông điệp yêu thương mỗi ngày sẽ được quản trị viên cập nhật sớm. Chúc bạn một ngày lái xe an toàn và vui vẻ!"
        };

    } catch (error) {
        console.error("Error fetching daily quote from Firestore:", error);
        return { error: "Rất tiếc, đã có lỗi xảy ra khi tải thông điệp. Vui lòng thử lại sau." };
    }
};
