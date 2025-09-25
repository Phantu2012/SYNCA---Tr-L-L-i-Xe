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

    } catch (error: any) {
        // For permission denied or offline errors, gracefully fall back to the default quote
        // as this is a non-critical feature. This improves UX by not showing an error message.
        if (error.code === 'permission-denied' || error.code === 'unavailable') {
            console.warn(`Firestore call for daily quote failed, falling back to default. Code: ${error.code}`);
            return {
                quote: "Chào mừng đến với Synca! Hãy bắt đầu một ngày mới tràn đầy năng lượng.",
                author: "Synca Team",
                analysis: "Thông điệp yêu thương mỗi ngày sẽ được quản trị viên cập nhật sớm. Chúc bạn một ngày lái xe an toàn và vui vẻ!"
            };
        }
        
        // For other, unexpected errors, log them and show a generic error message on the UI.
        console.error("Error fetching daily quote from Firestore:", error);
        return { error: "Rất tiếc, đã có lỗi xảy ra khi tải thông điệp. Vui lòng thử lại sau." };
    }
};