import { ChromaClient } from "chromadb";
const client = new ChromaClient();

(async () => {
	const collection = await client.getOrCreateCollection({
		name: "my_collection",
	});

	await collection.upsert({
		documents: [
			"This is a document about pineapple",
			"This is a document about oranges",
		],
		ids: ["id1", "id2"],
	});

	const results = await collection.query({
		queryTexts: "This is a query document about hawaii", // Chroma will embed this for you
		nResults: 2, // how many results to return
	});

	console.log(results);
})();
