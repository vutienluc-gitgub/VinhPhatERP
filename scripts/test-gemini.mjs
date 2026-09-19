import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: 'Xin chào! Hãy phản hồi ngắn gọn xác nhận bạn đã kết nối thành công.',
    });
    console.log(response.text);
  } catch (error) {
    console.error('Lỗi khi gọi Gemini API:', error);
  }
}

main();
