# src/ai

- `models.ts`: the one place model names, effort and limits live (shared with the serverless function)
- `client.ts`: calls `/api/ai` and reads the streamed reply
- `prompt.ts`: builds a Section's system prompt from `prompts/_shared.md` + the Section persona
- `Chat.tsx`: reusable streaming chat for any Section
- `prompts/`: the personas, as Markdown you can edit
