import "dotenv/config";

export const config = {
	pdfPath: "docs/shinobi-no-sho-4-1-b.pdf",
	splitter: {
		chunkSize: Number(process.env.SPLITTER_CHUNK_SIZE),
		chunkOverlap: Number(process.env.SPLITTER_CHUNK_OVERLAP),
	},
	embedding: {
		modelName: process.env.EMBEDDING_MODEL_NAME,
	},
	llm: {
		modelName: process.env.LLM_MODEL_NAME,
	},
	vectorStore: {
		collectionName: process.env.VECTOR_STORE_COLLECTION_NAME,
	},
};
