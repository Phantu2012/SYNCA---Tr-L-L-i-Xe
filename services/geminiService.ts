
import { GoogleGenAI } from "@google/genai";

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Gemini features will not work.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const getMaintenanceTips = async (prompt: string): Promise<string> => {
    if (!process.env.API_KEY) {
        return "Tính năng AI chưa được cấu hình. Vui lòng thiết lập API Key.";
    }
    try {
        // FIX: Use systemInstruction in config as per Gemini API guidelines.
        const systemInstruction = "Bạn là một chuyên gia cơ khí ô tô giàu kinh nghiệm và thân thiện. Hãy đưa ra lời khuyên bảo dưỡng xe hữu ích, rõ ràng, và dễ hiểu cho người lái xe phổ thông. Trả lời bằng tiếng Việt.";

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
            },
        });
        
        return response.text;
    } catch (error) {
        console.error("Error generating content from Gemini:", error);
        return "Rất tiếc, đã có lỗi xảy ra khi kết nối với trợ lý AI. Vui lòng thử lại sau.";
    }
};
