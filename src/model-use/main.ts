import { Chroma } from "@langchain/community/vectorstores/chroma";
import "dotenv/config";
import { OllamaEmbeddings } from "@langchain/ollama";
import { ChatOllama } from "@langchain/ollama";
import { config } from "../config";

(async () => {
	const query = process.argv[2];
	console.log("Query: ", query);

	const embeddings = new OllamaEmbeddings({
		model: config.embedding.modelName,
	});

	const vectorStore = await Chroma.fromExistingCollection(embeddings, {
		collectionName: config.vectorStore.collectionName,
	});

	const results = await vectorStore.similaritySearch(query, 4);

	for (const result of results) {
		console.log("📄 Resultado:", result.pageContent.slice(0, 300), "\n---");
	}

	const llm = new ChatOllama({ model: config.llm.modelName });

	const context = results.map((r) => r.pageContent).join("\n\n");
	const prompt = `
  Você é um especialista no sistema de RPG chamado "Naruto: Shinobi no Sho". Responda à pergunta abaixo com base exclusivamente nas informações fornecidas no contexto. Seja claro, direto e mantenha a terminologia usada no sistema.

  Se a resposta não estiver no contexto, diga apenas "Não encontrei essa informação no material."

  ---

  📄 CONTEXTO:
  ${context}

  ❓ PERGUNTA:
  ${query}

  📝 RESPOSTA:
  `;

	const res = await llm.invoke(prompt);

	console.log("🤖 Resposta do bot:", res.content);
})();
