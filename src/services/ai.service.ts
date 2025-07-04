import { OpenAI } from "openai";
import { supabase } from "../lib/supabase";
import { questionsService } from "./questions.service";
import { chaptersService } from "./chapters.service";
import { getEmbedding, cosineSimilarity } from "../utils/embedding.util";

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY!,
  baseURL: "https://api.groq.com/openai/v1",
});

export const aiService = {
  generateAnswer: async (questionId: string) => {
    try {
      console.log("🔍 Fetching question:", questionId);
      const questionResponse = await questionsService.getQuestionById(questionId);

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

      console.log("📚 Fetching chapter embeddings for title:", title_id);

      // Fetch chapter embeddings
      const { data: embeddingsData, error: embeddingsError } = await supabase
        .from("chapter_embeddings")
        .select(`
          embedding,
          chapters!inner(
            id,
            name,
            order,
            content,
            title_id
          )
        `)
        .eq("chapters.title_id", title_id);

      if (embeddingsError || !embeddingsData || embeddingsData.length === 0) {
        console.error("❌ Chapter embeddings fetch failed:", embeddingsError);
        throw new Error(`Failed to fetch chapter embeddings: ${embeddingsError?.message}`);
      }

      // Debug: Log the actual structure
      console.log("🔍 DEBUG: First item structure:", JSON.stringify(embeddingsData[0], null, 2));

      const chaptersWithEmbeddings: Array<{
        chapter: any;
        embedding: number[];
      }> = [];

      embeddingsData.forEach((item: any) => {
        let parsedEmbedding: number[];

        try {
          parsedEmbedding =
            typeof item.embedding === "string"
              ? JSON.parse(item.embedding)
              : item.embedding;
        } catch (err) {
          console.error("❌ Failed to parse embedding:", item.embedding);
          throw new Error("Invalid embedding format in DB");
        }

        const chapter = Array.isArray(item.chapters) ? item.chapters[0] : item.chapters;

        if (chapter?.order <= (chapter_limit || Infinity)) {
          chaptersWithEmbeddings.push({
            chapter,
            embedding: parsedEmbedding,
          });
        }
      });

      if (chaptersWithEmbeddings.length === 0) {
        throw new Error(`No chapters available within chapter limit: ${chapter_limit}`);
      }

      console.log(`📚 Found ${chaptersWithEmbeddings.length} chapters within limit`);

      console.log("📐 Getting embedding for question...");
      if (!question_text) {
        throw new Error("Question text is null or empty");
      }

      const questionEmbedding = await getEmbedding(question_text);

      const chaptersWithScores = chaptersWithEmbeddings.map((item) => {
        return {
          id: item.chapter.id,
          name: item.chapter.name,
          order: item.chapter.order,
          content: item.chapter.content,
          title_id: item.chapter.title_id,
          similarity: cosineSimilarity(questionEmbedding, item.embedding),
        };
      });

      const relevantChapters = chaptersWithScores
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);

      if (relevantChapters.length === 0) {
        throw new Error("No relevant chapters found based on semantic similarity.");
      }

      console.log("🧠 Top relevant chapters:");
      relevantChapters.forEach((c) =>
        console.log(`- ${c.name} (order: ${c.order}, similarity: ${c.similarity.toFixed(3)})`)
      );

      const contextText = relevantChapters
        .sort((a, b) => a.order - b.order)
        .map((chapter) => {
          const chapterName = chapter.name || `Chapter ${chapter.order}`;
          const chapterContent = chapter.content || "";
          return `Chapter ${chapter.order}: ${chapterName}\n${chapterContent}`;
        })
        .join("\n\n");

      console.log(`📝 Context built with ${contextText.length} characters from ${relevantChapters.length} chapters`);

      const prompt = `
You are a helpful assistant. Use ONLY the information provided in the chapters below to answer the question. DO NOT use prior knowledge or guess. If the answer isn't found in the content, reply: "I could not find the answer in the provided chapters."

### Available Chapters (selected based on relevance):
${contextText}

### Question:
${question_text}

### Notes:
- Avoid spoilers from content beyond Chapter ${chapter_limit || "limit"}
- Stay factual and concise.
- Do NOT fabricate or assume details not present in the text.
`;

      await questionsService.updateQuestionStatus(questionId, "pending");

      console.log("🤖 Calling Groq API...");
      const response = await openai.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const answer = response.choices[0]?.message?.content;
      if (!answer) {
        throw new Error("No answer generated by AI");
      }

      console.log("✅ Answer generated successfully");

      await questionsService.updateQuestionAnswer(questionId, answer);
      await questionsService.updateQuestionStatus(questionId, "answered");

      return answer;
    } catch (error) {
      console.error("❌ AI service error:", error);
      await questionsService.updateQuestionStatus(questionId, "failed");
      throw error;
    }
  },

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
