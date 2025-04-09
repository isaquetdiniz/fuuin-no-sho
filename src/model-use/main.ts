import { Chroma } from "@langchain/community/vectorstores/chroma";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatOllama, OllamaEmbeddings } from "@langchain/ollama";
import { config } from "../config";

const userInput = process.argv[2];
if (!userInput || !userInput.length) {
	console.error("❌ Por favor, forneça uma pergunta como argumento.");
	process.exit(1);
}

console.info("❓ Pergunta original:", userInput);

const run = async () => {
	const llm = new ChatOllama({ model: config.llm.modelName });

	const embeddings = new OllamaEmbeddings({
		model: config.embedding.modelName,
	});
	const vectorStore = await Chroma.fromExistingCollection(embeddings, {
		collectionName: config.vectorStore.collectionName,
	});

	const results = await vectorStore.similaritySearch(userInput, 4);

	if (!results.length) {
		console.warn("⚠️ Nenhum resultado relevante encontrado.");
		process.exit(0);
	}

	const context = results
		.map(
			(doc, i) =>
				`Trecho ${i + 1} (p. ${doc.metadata.pageNumber ?? "?"}):\n${doc.pageContent}`,
		)
		.join("\n\n");

	console.info(context, "\n\n");

	const responsePrompt = PromptTemplate.fromTemplate(`
      Você é um especialista no sistema de RPG chamado \"Naruto: Shinobi no Sho\".
      Baseando-se apenas no contexto abaixo, responda à pergunta do jogador com precisão e clareza.
      Se não encontrar a resposta no material, diga: \"Não encontrei essa informação no material.\"

      ---
      📄 CONTEXTO:
      {context}

      ❓ PERGUNTA:
      {question}

      📝 RESPOSTA:
      `);

	const prompt = await responsePrompt.format({ context, question: userInput });

	const result = await llm.invoke(prompt);

	if (!result?.content || (result.content as string).trim().length <= 15) {
		console.warn("⚠️ Resposta insuficiente. Mostrando contexto bruto:");
		console.info("\n\n📚 Trechos relevantes:\n");
		console.info(context);
		process.exit(0);
	}

	console.log("🤖 Resposta:", result.content);
};

run();
