/** The AI models a host can choose in the designer, and what each request costs in AI credits. Safe in the browser. */
export const AI_PROVIDERS = {
  claude: { name: 'Claude', by: 'Anthropic', design: 2, image: null, note: 'Best at matching a design' },
  gpt: { name: 'GPT', by: 'OpenAI', design: 2, image: 3, note: 'Designs and pictures' },
  gemini: { name: 'Gemini', by: 'Google', design: 1, image: 2, note: 'Cheapest' },
} as const

export type AiProvider = keyof typeof AI_PROVIDERS
export type AiKind = 'design' | 'image'
export const AI_PROVIDER_IDS = Object.keys(AI_PROVIDERS) as AiProvider[]
export const isAiProvider = (v: unknown): v is AiProvider => typeof v === 'string' && v in AI_PROVIDERS

/** Credits for one request, or null when that model cannot do it (Claude does not draw pictures). */
export const aiCost = (provider: AiProvider, kind: AiKind): number | null => AI_PROVIDERS[provider][kind]
