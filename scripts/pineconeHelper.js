import { Ollama } from "ollama";
import { Pinecone } from "@pinecone-database/pinecone";

const ollamaLocal = new Ollama({
    host: 'http://127.0.0.1:11434',
});

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});
const index = pinecone.index('my-rag-index');


function generateRandomString() {
    return Math.random().toString(36).substring(2, 15);
}

async function saveEmbedding(chunks) {
    const embaseResponse = await ollamaLocal.embeddings({
        model: 'bge-m3',
        prompt: chunks,
    });

    const vector = embaseResponse.embedding;
    if (!Array.isArray(vector) || vector.length === 0) {
        throw new Error('Ollama embeddings 返回为空，无法写入 Pinecone。');
    }

    await index.upsert({
        records: [
            {
                id: generateRandomString(),
                values: vector,
                metadata: { text: chunks },
            },
        ],
    });
}

export default {
    saveEmbedding,
};