import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import "dotenv/config";
import { OllamaEmbeddings } from "@langchain/ollama";
import type { Document } from "langchain/document";

(async () => {
	const loader = new PDFLoader("docs/shinobi-no-sho-4-1-b.pdf");

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
		model: "nomic-embed-text",
	});

	await Chroma.fromDocuments(transformedDocs, embeddings, {
		collectionName: "rpg-rules",
	});

	console.log("PDF was indexed!");
})();
