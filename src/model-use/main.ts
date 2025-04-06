import { Chroma } from "@langchain/community/vectorstores/chroma";
import "dotenv/config";
import { OllamaEmbeddings } from "@langchain/ollama";
import { ChatOllama } from "@langchain/ollama";

(async () => {
	const query = process.argv[2];
	console.log("Query: ", query);

	const embeddings = new OllamaEmbeddings({
		model: "nomic-embed-text",
	});

	const vectorStore = await Chroma.fromExistingCollection(embeddings, {
		collectionName: "rpg-rules",
	});

	const results = await vectorStore.similaritySearch(query, 6);

	for (const result of results) {
		console.log("📄 Resultado:", result.pageContent.slice(0, 300), "\n---");
	}

	const llm = new ChatOllama({ model: "llama3" });

	const context = results.map((r) => r.pageContent).join("\n\n");
	const prompt = `Você é um agente especializado no RPG Naruto Shinobi no Sho.\nUse o texto abaixo, retirado do livro de regras, para responder à pergunta:\n\n${context}\n\nPergunta: ${query}`;

	const res = await llm.invoke(prompt);

	console.log("🤖 Resposta do bot:", res.content);
})();
