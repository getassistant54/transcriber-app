export interface HydraCallResult {
  parsedResponse: any;
  inputTokens: number;
  outputTokens: number;
  modelUsed: string;
}

export async function callHydraAi(
  prompt: string,
  systemPrompt: string,
  model = 'gemini-2.5-flash',
  baseUrl = 'https://api.hydraai.ru/v1'
): Promise<HydraCallResult> {
  const hydraApiKey = process.env.HYDRA_API_KEY || process.env.HYDRA_AI_API_KEY || process.env.OPENAI_API_KEY || '';
  if (!hydraApiKey) {
    throw new Error('HYDRA_API_KEY не задан в переменных окружения.');
  }

  const endpoint = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${hydraApiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Hydra API HTTP ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  const inputTokens = data.usage?.prompt_tokens || Math.round(prompt.length / 3.5);
  const outputTokens = data.usage?.completion_tokens || Math.round(content.length / 3.5);

  let cleanedText = content.trim();
  if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }

  return {
    parsedResponse: JSON.parse(cleanedText),
    inputTokens,
    outputTokens,
    modelUsed: `hydra:${model}`,
  };
}
