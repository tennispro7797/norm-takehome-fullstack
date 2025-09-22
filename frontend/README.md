This is a React [Next.js](https://nextjs.org/) project with Chakra and Tailwind CSS installed.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Formatting

You can format files with:

```bash
npm run format

pnpm format

yarn format

bun format
```

## Functionality

- You can click on the law document to view it and chat with the Norm assistant to answer any queries about it.
- After typing in your query, you'll get a response with citations at the bottom of the message.
- Clicking on a citation will scroll to and highlight the law being citated.
- There is also a "Referenced Sections" panel at the bottom left of the screen so that you can scroll through and quickly see the source text for each citation.

## Notes

- To demo what the home page and document view page would look like, I added a `docs` folder with the `laws.pdf`, but in production, all documents would be fetched via an API call. The actual PDF was needed so that the user can view the document and see the cited law in the document itself.

## Reflective Response

> What unique challenges do you foresee in developing and integrating AI regulatory agents for legal compliance from a full-stack perspective? How would you address these challenges to make the system robust and user-friendly?

The following are the main challenges I forsee in developing and integrating AI regulatory agents for legal compliance:

- Properly parsing the many different types of legal documents, file types, handwritten vs. digitized files, across all industries. Missing a word here and there can drastically alter the meaning of the law, so every single character needs to be properly accounted for.
- Understanding the nuances in the language of law since similar phrases could mean totally different things: what might be permissable in one instance is not in another. Plus, there might be differences across different industries.
- For companies operating interationally, these AI agents need to understand the language and interpretation of the law in those different countries.
- When users are checking if their documents are up to par with all the regulations, they will want to see the citations for violations, or chat with an AI agent about laws regarding a document / group of documents (similar to this take home assessment). These agents not only need to provide citations, but then also recommend the necessary edits so the documents are no longer violating any regulations (not a strict must but would make the product much more compelling / complete)
- Hundreds of different highly customized AI pipelines for parsing -> processing -> suggesting edits will need to exist for different legal docs across different industries. Any new customers from different industries / locales will add to this complexity.
- Some documents will require certain security measures, so might need to run on different models or in-house models depending on the privacy policy.
- The platform will also need to ensure that these documents finish processing in a reasonable amount of time.
- In general managing the cost of making all these LLM calls will be a challenge.

I would address these challenges in the following ways:

- Build specific customized agents to parse through the different file types (PDF, PDFs with visual elements, word docs, excel docs, etc.) with context of the kind of data (structured with sections like the `laws.pdf` doc, longer form docs with headings and tons of text between, etc). For example, an AI agent specifically for parsing PDFs with structured text (like the `laws.pdf` file), and another for parsing a more complex PDF with visual digrams. For simpler documents, not using AI agents and just regular document parsing would be ideal.
- Have lawyers from each industry where we're building AI agents to understand and parse through the laws. They will be heavily used to make sure these processing AI agents are actually understanding how to interpret the text that is parsed from the parsing agents.
- Start small and build / test / verify these agents in one locale before expanding to others.
- Work with the lawyers to understand where fine-tuning models to train on specific industries / regulation types is relevant vs relying on the knowledge of a foundational model and RAG pipelines. Fine tuning could be really useful for industries where the language of the law is tricker and more nuanced. These agents will then be used to recommend edits to address violations in a document.
- Create a platform with custom nodes for specific tasks (parsing a specific format, processing legal docs in a specific industry, etc) that can be chained together to create any number of workflows that can properly process all kinds of legal documents. The more documents the platform processes, the better it becomes since each specific node (specialized AI agent) is being tested on more data, so engineers can update and tweak it as needed to work even better. For agents using fine-tuned models, the more documents / data, the more training data for fine-tuning.
- Have a distributed system leveraging tools like queues / message brokers, and worker services for specific tasks in auto scaling groups to process documents in a reasonable time.
- To address the concern of cost, I'd consider using more cost efficient models, caching queries, and possibly running models on my own infra (could be cheaper than using APIs)
