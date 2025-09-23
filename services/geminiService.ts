

// Fix: Use the correct import 'GoogleGenAI' as 'GoogleGenerativeAI' is deprecated.
import { GoogleGenAI } from "@google/genai";

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Gemini features will not work.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export interface DailyQuote {
    quote: string;
    author: string;
    analysis: string;
}

export const getDailyQuote = async (): Promise<DailyQuote | { error: string }> => {
    if (!process.env.API_KEY) {
        return { error: "Tính năng AI chưa được cấu hình. Vui lòng thiết lập API Key." };
    }
    try {
        const systemInstruction = `Bạn là một triết gia và nhà tâm lý học sâu sắc. Hãy cung cấp MỘT câu nói truyền cảm hứng về lòng biết ơn, tình yêu bản thân, hoặc hạnh phúc trong cuộc sống. 
Yêu cầu định dạng trả lời phải là một đối tượng JSON với 3 khóa: 
1. 'quote': Nội dung câu nói.
2. 'author': Tác giả hoặc nguồn gốc của câu nói (nếu không rõ, ghi 'Khuyết danh').
3. 'analysis': Một đoạn phân tích ngắn (khoảng 2-3 câu) sâu sắc, thâm thúy về ý nghĩa của câu nói và cách áp dụng vào cuộc sống để trở nên an nhiên, hạnh phúc hơn.
Hãy đảm bảo câu trả lời luôn bằng tiếng Việt và chỉ trả về đối tượng JSON, không có bất kỳ văn bản nào khác.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "Cung cấp cho tôi một thông điệp yêu thương cho ngày hôm nay.",
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
            },
        });
        
        const responseText = response.text;
        const parsedJson = JSON.parse(responseText);

        if (parsedJson.quote && parsedJson.author && parsedJson.analysis) {
            return parsedJson as DailyQuote;
        } else {
            throw new Error("Invalid JSON structure from Gemini.");
        }

    } catch (error) {
        console.error("Error generating quote from Gemini:", error);
        return { error: "Rất tiếc, đã có lỗi xảy ra khi tạo thông điệp. Vui lòng thử lại sau." };
    }
};