import { OpenAI } from "openai";
import { supabase } from "../lib/supabase";
import { questionsService } from "./questions.service";
import { chaptersService } from "./chapters.service";

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY!,
  baseURL: "https://api.groq.com/openai/v1", // <- use Groq's base
});

export const aiService = {
  generateAnswer: async (questionId: string) => {
    try {
      // 1. Fetch question with better error handling
      console.log("🔍 Fetching question:", questionId);
      const questionResponse = await questionsService.getQuestionById(
        questionId
      );

      if (!questionResponse.success || !questionResponse.data) {
        console.error("❌ Question fetch failed:", questionResponse.error);
        throw new Error(`Question not found: ${questionResponse.error}`);
      }

      const { title_id, chapter_limit, question_text } = questionResponse.data;
      console.log("✅ Question found:", {
        title_id,
        chapter_limit,
        question_text,
      });

      // 2. Fetch chapters with proper error handling
      console.log("📚 Fetching chapters for title:", title_id);
      const chaptersResponse = await chaptersService.getChaptersByTitle(
        title_id
      );

      console.log("📊 Chapters response:", {
        success: chaptersResponse.success,
        dataLength: chaptersResponse.data?.length || 0,
        error: chaptersResponse.error,
      });

      if (!chaptersResponse.success || !chaptersResponse.data) {
        console.error("❌ Chapters fetch failed:", chaptersResponse.error);
        throw new Error(`Failed to fetch chapters: ${chaptersResponse.error}`);
      }

      if (chaptersResponse.data.length === 0) {
        console.warn("⚠️ No chapters found for title:", title_id);
        throw new Error(`No chapters found for title: ${title_id}`);
      }

      // 3. Filter chapters based on chapter_limit
      let relevantChapters = chaptersResponse.data;
      if (chapter_limit && chapter_limit > 0) {
        relevantChapters = chaptersResponse.data.filter(
          (chapter) => (chapter.order || 0) <= chapter_limit
        );
        console.log(
          `📖 Filtered to ${relevantChapters.length} chapters (limit: ${chapter_limit})`
        );
      }

      if (relevantChapters.length === 0) {
        throw new Error(
          `No chapters available within the specified limit: ${chapter_limit}`
        );
      }

      // 4. Build context text
      const contextText = relevantChapters
        .sort((a, b) => (a.order || 0) - (b.order || 0)) // Ensure proper ordering
        .map((chapter) => {
          const chapterName = chapter.name || `Chapter ${chapter.order}`;
          const chapterContent = chapter.content || "";
          return `Chapter ${chapter.order}: ${chapterName}\n${chapterContent}`;
        })
        .join("\n\n");

      console.log(`📝 Context built with ${contextText.length} characters`);

      // 5. Build prompt
      const prompt = `
You are a helpful assistant. Answer the question below based ONLY on the content from the chapters provided.

### Available Chapters:
${contextText}

### Question:
${question_text}

### Instructions:
- Only answer based on the provided chapters
- If the question cannot be answered from the given chapters, say so
- Avoid spoilers from content beyond chapter ${chapter_limit || "limit"}
- Be concise but thorough in your response
`;

      // 6. Update question status to processing
      await questionsService.updateQuestionStatus(questionId, "pending");

      // 7. Call OpenAI API
      console.log("🤖 Calling OpenAI API...");
      const response = await openai.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct", // 👈 Replace with Groq model
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const answer = response.choices[0]?.message?.content;

      if (!answer) {
        throw new Error("No response received from OpenAI");
      }

      console.log("✅ AI response received");

      // 8. Save answer using the service method
      const updateResponse = await questionsService.updateQuestionAnswer(
        questionId,
        answer
      );

      if (!updateResponse.success) {
        console.error("❌ Failed to save answer:", updateResponse.error);
        throw new Error(`Failed to save answer: ${updateResponse.error}`);
      }

      console.log("✅ Answer saved successfully");
      return answer;
    } catch (error) {
      console.error("❌ AI Service Error:", error);

      // Update question status to failed
      try {
        await questionsService.updateQuestionStatus(questionId, "failed");
      } catch (statusError) {
        console.error("❌ Failed to update question status:", statusError);
      }

      throw error;
    }
  },

  // Additional helper method for testing chapter retrieval
  testChapterRetrieval: async (titleId: string) => {
    try {
      console.log("🧪 Testing chapter retrieval for title:", titleId);

      const response = await chaptersService.getChaptersByTitle(titleId);

      console.log("Test results:", {
        success: response.success,
        error: response.error,
        dataCount: response.data?.length || 0,
        chapters: response.data?.map((c) => ({
          id: c.id,
          order: c.order,
          name: c.name,
          contentLength: c.content?.length || 0,
        })),
      });

      return response;
    } catch (error) {
      console.error("❌ Test failed:", error);
      throw error;
    }
  },
};
