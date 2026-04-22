import { validateRefactorReport } from './validate-refactor-report';

export async function executeAiWithRefactorValidation(
  prompt: string,
  callAIAgain: (prompt: string) => Promise<string>,
) {
  let aiResponse = await callAIAgain(prompt);

  for (let i = 0; i < 3; i++) {
    try {
      // Thử validate kết quả AI trả về
      return validateRefactorReport(aiResponse);
    } catch (_error) {
      console.warn(
        `⚠️ Lần thử ${i + 1} thất bại do không đúng format Refactor Report. AI đang gọi lại...`,
      );
      // Truyền thêm context lỗi vào prompt để ép AI phải tuân thủ format
      const retryPrompt = `${prompt}\n\n[HỆ THỐNG]: Lần trả lời trước của bạn không tuân thủ cấu trúc Refactor Report. Vui lòng in đúng format Markdown bắt buộc.`;
      aiResponse = await callAIAgain(retryPrompt);
    }
  }

  throw new Error(
    '❌ AI failed after 3 retries: Không thể trả về Refactor Report đúng format.',
  );
}
