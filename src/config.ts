import "dotenv/config";

export const config = {
	pdfPath: "docs/shinobi-no-sho-4-1-b.pdf",
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
