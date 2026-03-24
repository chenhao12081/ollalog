import { Ollama } from "ollama";
import { Pinecone } from '@pinecone-database/pinecone';
import express from "express";
import { generateText } from 'ai';
import { ollama as ollamaProvider } from 'ollama-ai-provider-v2';

const app = express();
const port = process.env.PORT || 3000;


const ollamaLocal = new Ollama({
  host: "http://127.0.0.1:11434",
})
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index('my-rag-index');

app.use(express.json());

app.post("/api/chat", async (req, res) => {
  const { message } = req.body ?? {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({
      error: "message is required and must be a string",
    });
  }

  const embaseResponse = await ollamaLocal.embeddings({
    model: 'bge-m3',
    prompt: message,
  });

  const vector = embaseResponse.embedding;
  
  const searchResults = await index.query({
    vector: vector,
    topK: 1,
    includeMetadata: true,
  });

  const bestMatch = searchResults.matches[0];
  const hybridPrompt = `
    【上下文信息】:${bestMatch.metadata.text}
    【用户问题】:${message}
  `;

  const response = await generateText({
      model: ollamaProvider('qwen2.5'),
      prompt: hybridPrompt,
  });
  
  // Placeholder response for future RAG pipeline integration.
  res.send(response.output);
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
