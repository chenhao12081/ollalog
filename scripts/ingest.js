import mammoth from "mammoth";
import { MarkdownTextSplitter } from "@langchain/textsplitters";
import path from "path";
import { fileURLToPath } from "url";
import pineconeHelper from "./pineconeHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetFile = path.join(__dirname, "../data/work_operation.docx");

async function processDocxQa(filePath) {
    const options = {
        styleMap: [
            "p[style-name='Heading 2'] => h2:fresh",
        ],
    };

    const result = await mammoth.convertToHtml({
        path: filePath,
    }, options);
    let htmlText = result.value;

    let markdownContent = htmlText
    .replace(/<h2>(.*?)<\/h2>/g, '\n## $1\n')
    .replace(/<p>(.*?)<\/p>/g, '$1\n')
    .replace(/<[^>]+>/g, '');

    const headersToSplitOn = [
        ['##', 'Qusetion'],
    ];

    const markdownSplitter = new MarkdownTextSplitter({
        headersToSplitOn,
        chunkSize: 500,
        chunkOverlap: 50,
    });

    const chunks = await markdownSplitter.createDocuments([markdownContent]);

    console.log('@chunks长度', chunks.length);

    for (const chunk of chunks) {
        if (!chunk.pageContent) {
            continue;
        }

        await pineconeHelper.saveEmbedding(chunk.pageContent);
    }

    console.log("已将 chunks 写入 Pinecone");
}

processDocxQa(targetFile);