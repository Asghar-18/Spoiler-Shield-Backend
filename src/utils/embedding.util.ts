import axios from "axios";

const HF_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN!;

export const getEmbedding = async (text: string): Promise<number[]> => {
  try {
    const response = await axios.post(
          "https://api-inference.huggingface.co/models/BAAI/bge-large-en-v1.5", // ✅ NEW

      {
        inputs: [text],
        options: { wait_for_model: true },
      },
      {
        headers: {
          Authorization: `Bearer ${HF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const embedding = response.data[0]; // Should be an array of numbers

    if (!embedding || !Array.isArray(embedding)) {
      console.error("⚠️ Unexpected Hugging Face embedding response:", response.data);
      throw new Error("Invalid embedding response from Hugging Face");
    }

    return embedding;
  } catch (error: any) {
    console.error("❌ Hugging Face embedding error:", error.response?.data || error.message);
    throw new Error("Failed to generate embedding using Hugging Face");
  }
};


export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dot / (magA * magB);
};
