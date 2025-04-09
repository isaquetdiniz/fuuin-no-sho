import { Chroma } from "@langchain/community/vectorstores/chroma";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { config } from "../config";

const userInput = process.argv[2];
if (!userInput || !userInput.length) {
	console.error("❌ Por favor, forneça uma pergunta como argumento.");
	process.exit(1);
}

console.log("❓ Pergunta original:", userInput);

const run = async () => {
	const llm = new ChatOllama({ model: config.llm.modelName });
	const embeddings = new OllamaEmbeddings({
		model: config.embedding.modelName,
	});

	const vectorStore = await Chroma.fromExistingCollection(embeddings, {
		collectionName: config.vectorStore.collectionName,
	});

	const rewriterPrompt = PromptTemplate.fromTemplate(`
Você é um assistente especializado em RPG. Gere até 5 variações ou reformulações úteis para a pergunta abaixo, pensando em formas diferentes que jogadores poderiam fazer a mesma pergunta, usando termos semelhantes ou sinônimos.

Pergunta original:
{input}

Responda com uma lista numerada de reformulações, curtas e diretas (em português do brasil).
`);

	const reformPrompt = await rewriterPrompt.format({ input: userInput });
	const reformResult = await llm.invoke(reformPrompt);

	const synonymQueries = [userInput];
	const lines = (reformResult.content as string).split("\n");
	for (const line of lines) {
		const match = line.match(/^\d+\.\s*(.*)$/);
		if (match?.[1]) synonymQueries.push(match[1].trim());
	}
	console.log(synonymQueries);

	const resultsMap = new Map();
	for (const q of synonymQueries) {
		const results = await vectorStore.similaritySearchWithScore(q, 4);
		// biome-ignore lint/complexity/noForEach: <explanation>
		results.forEach(([doc, score]) => {
			const key = doc.pageContent.slice(0, 100);
			if (!resultsMap.has(key) || resultsMap.get(key).score < score) {
				resultsMap.set(key, { doc, score });
			}
		});
	}

	const topResults = Array.from(resultsMap.values())
		.sort((a, b) => b.score - a.score)
		.slice(0, 4)
		.map((r) => r.doc);

	const context = topResults
		.map(
			(r, i) =>
				`Trecho ${i + 1} (p. ${r.metadata.pageNumber ?? "?"}):\n${r.pageContent}`,
		)
		.join("\n\n");

	const responsePrompt = PromptTemplate.fromTemplate(`
Você é um especialista no sistema de RPG chamado \"Naruto: Shinobi no Sho\".

Baseando-se apenas no contexto abaixo, responda à pergunta do jogador. Use a terminologia correta do sistema.
Se a resposta não estiver clara ou não for possível responder com certeza, diga: \"Não encontrei essa informação no material.\"

---
📄 CONTEXTO:
{context}

❓ PERGUNTA:
{question}

📝 RESPOSTA:
`);

	const prompt = await responsePrompt.format({ context, question: userInput });
	console.log("Prompt usado: ", prompt);

	const result = await llm.invoke(prompt);

	if (!result?.content || (result.content as string).trim().length < 5) {
		console.log("⚠️ Resposta insuficiente. Mostrando contexto bruto:");
		console.log("\n\n📚 Trechos relevantes:\n");
		console.log(context);
		return;
	}

	console.log("🤖 Resposta:", result.content);
};

run();
