import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OllamaEmbeddings } from "@langchain/ollama";
import type { Document } from "langchain/document";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { config } from "../config";

(async () => {
	const loader = new PDFLoader(config.pdfPath);

	const pdf = await loader.load();

	const splitter = new RecursiveCharacterTextSplitter({
		chunkSize: 500,
		chunkOverlap: 50,
	});

	const docs = await splitter.splitDocuments(pdf);
	const transformedDocs: Document<Record<string, string>>[] = docs.map(
		(doc) => ({
			pageContent: doc.pageContent,
			metadata: {
				source: doc.metadata.source,
				loc: JSON.stringify(doc.metadata.loc),
			},
		}),
	);

	console.log("Docs generated!", transformedDocs.length);

	const embeddings = new OllamaEmbeddings({
		model: config.embedding.modelName,
	});

	await Chroma.fromDocuments(transformedDocs, embeddings, {
		collectionName: config.vectorStore.collectionName,
	});

	console.log("PDF was indexed!");
})();
