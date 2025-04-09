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
		chunkSize: config.splitter.chunkSize,
		chunkOverlap: config.splitter.chunkOverlap,
	});

	const docs = await splitter.splitDocuments(pdf);

	const transformedDocs: Document<Record<string, string>>[] = docs.map(
		(doc) => ({
			pageContent: doc.pageContent,
			metadata: {
				source: doc.metadata.source,
				pageNumber: doc.metadata.loc.pageNumber,
				linesFrom: doc.metadata.loc.lines.from,
				linesTo: doc.metadata.loc.lines.to,
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
