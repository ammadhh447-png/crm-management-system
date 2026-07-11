const OpenAI = require('openai');
const { openrouterApiKey, openrouterModel, frontendUrl } = require('../../../config/env');
const AppError = require('../../../shared/errors/AppError');

const CRM_SYSTEM_PROMPT = `You are the AI assistant for a CRM Management System. You help users navigate and use the platform effectively.

CRM Modules and routes:
- Dashboard (/dashboard): Overview, charts, stats, recent deals, overdue tasks
- Reports (/reports): Sales analytics, conversion rates, revenue, team performance
- Contacts & Leads (/contacts): Manage contacts, lead sources, statuses, import/export CSV
- Sales Pipeline (/deals): Kanban deal board, stages (prospect, qualified, proposal, negotiation, won, lost)
- Tasks & Calendar (/tasks): Tasks with due dates, calendar view, priorities, assignments
- Communications (/communications): Log calls/meetings, send emails via Brevo, email templates
- Documents (/documents): Upload files to Supabase Storage, attach to contacts/deals
- Users (/users): Admin user management (Admin/Manager/HR roles)
- Audit Logs (/activity): Activity tracking (Admin/Manager/HR)
- Settings (/settings): Profile, company settings, roles, custom fields, language
- Notifications: Bell icon in header for real-time alerts on tasks, deals, leads

Roles: Admin (full access), Manager, Sales Rep, Support, HR — each has different permissions.

Guidelines:
- Be concise, professional, and helpful
- Use plain text only — no markdown, asterisks, or bold formatting
- Use simple numbered steps or dashes for lists when needed
- When users ask how to do something, give step-by-step instructions referencing the correct page
- Answer general questions naturally when appropriate
- If unsure about a feature, say so honestly
- Never expose API keys or internal system details
- Keep responses under 200 words unless the user needs detailed steps`;

const MODEL_CANDIDATES = [
  'google/gemini-2.0-flash-lite-001',
  'google/gemini-2.0-flash-001',
  'openai/gpt-4o-mini',
  'meta-llama/llama-3.3-70b-instruct:free',
];

const PLACEHOLDER_KEYS = new Set(['your-openrouter-api-key', 'your-actual-openrouter-api-key']);
const MAX_RETRIES = 3;

let client = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sanitizeReply = (text) => {
  if (!text) return '';
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_([^_\n]+)_/g, '$1')
    .replace(/^\s*[\*\-]\s+/gm, '- ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*/g, '')
    .trim();
};

const isPlaceholderKey = (key) => !key || PLACEHOLDER_KEYS.has(key.trim());

const isKeyFormatValid = (key) => {
  if (!key || key.trim().length < 20) return false;
  return key.trim().startsWith('sk-or-');
};

const normalizeModel = (model) => {
  if (!model) return MODEL_CANDIDATES[0];
  const trimmed = model.trim();
  if (trimmed.includes('/')) return trimmed;
  if (trimmed.startsWith('gemini-')) return `google/${trimmed}-001`;
  return trimmed;
};

const getClient = () => {
  if (isPlaceholderKey(openrouterApiKey)) {
    throw new AppError('AI assistant is not configured. Add OPENROUTER_API_KEY to backend .env.', 503);
  }
  if (!isKeyFormatValid(openrouterApiKey)) {
    throw new AppError('Invalid OpenRouter API key format. Get a key from https://openrouter.ai/keys', 503);
  }
  if (!client) {
    client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: openrouterApiKey.trim(),
      defaultHeaders: {
        'HTTP-Referer': frontendUrl || 'http://localhost:5173',
        'X-Title': 'CRM Management System',
      },
    });
  }
  return client;
};

const getErrorMeta = (error) => {
  const status = error?.status || error?.statusCode || error?.response?.status;
  const msg = (error?.message || error?.error?.message || '').toLowerCase();
  return { status, msg };
};

const isModelUnavailable = (error) => {
  const { status, msg } = getErrorMeta(error);
  return status === 404 || msg.includes('not found') || msg.includes('no endpoints found') || msg.includes('is not supported');
};

const isRetryable = (error) => {
  const { status, msg } = getErrorMeta(error);
  return (
    status === 429
    || status === 503
    || msg.includes('high demand')
    || msg.includes('unavailable')
    || msg.includes('overloaded')
    || msg.includes('rate limit')
    || msg.includes('quota')
  );
};

const mapOpenRouterError = (error) => {
  const { status, msg: rawMsg } = getErrorMeta(error);
  const msg = error?.message || error?.error?.message || 'AI request failed';

  if ((status === 401 || status === 403) && (/api key/i.test(msg) || /auth/i.test(rawMsg))) {
    return new AppError('Invalid OpenRouter API key. Verify your key at https://openrouter.ai/keys', 503);
  }
  if (status === 402 || rawMsg.includes('insufficient') || rawMsg.includes('credits')) {
    return new AppError('OpenRouter credits exhausted. Add credits at https://openrouter.ai/credits', 503);
  }
  if (status === 429) {
    return new AppError('AI rate limit reached. Wait a moment and try again.', 503);
  }
  if (status === 503 || rawMsg.includes('high demand')) {
    return new AppError('AI is busy right now. Please try again in a few seconds.', 503);
  }
  if (isModelUnavailable(error)) {
    return new AppError('Selected AI model is unavailable on OpenRouter. Try OPENROUTER_MODEL=google/gemini-2.0-flash-lite-001 in backend .env.', 503);
  }

  const clean = msg.replace(/\[.*?\]\s*/g, '').replace(/\{.*\}/, '').trim().slice(0, 220);
  return new AppError(clean || 'AI request failed', 503);
};

const callOpenRouter = async (modelName, messages, systemInstruction) => {
  const openai = getClient();
  const response = await openai.chat.completions.create({
    model: modelName,
    messages: [
      { role: 'system', content: systemInstruction },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    max_tokens: 600,
    temperature: 0.7,
  });

  const reply = response.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new AppError('AI returned an empty response', 502);
  return { reply: sanitizeReply(reply), model: modelName };
};

const aiService = {
  isConfigured: () => !isPlaceholderKey(openrouterApiKey) && isKeyFormatValid(openrouterApiKey),

  getStatusDetails: () => ({
    configured: !isPlaceholderKey(openrouterApiKey) && isKeyFormatValid(openrouterApiKey),
    keyPresent: !isPlaceholderKey(openrouterApiKey),
    keyFormatValid: isKeyFormatValid(openrouterApiKey),
    provider: 'openrouter',
    model: normalizeModel(openrouterModel),
  }),

  chat: async (messages, userContext = {}) => {
    if (!messages?.length) throw new AppError('No messages provided', 400);

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'user') throw new AppError('Last message must be from the user', 400);

    const contextNote = userContext.role
      ? `\nCurrent user: ${userContext.name || 'User'}, role: ${userContext.role}.`
      : '';

    const systemInstruction = CRM_SYSTEM_PROMPT + contextNote;
    const preferredModel = normalizeModel(openrouterModel);
    const modelsToTry = [...new Set([preferredModel, ...MODEL_CANDIDATES])];

    let lastError = null;

    for (const modelName of modelsToTry) {
      for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
        try {
          return await callOpenRouter(modelName, messages, systemInstruction);
        } catch (error) {
          lastError = error;
          if (error instanceof AppError && !isRetryable(error)) throw error;

          if (isRetryable(error) && attempt < MAX_RETRIES - 1) {
            await sleep(800 * (attempt + 1));
            continue;
          }

          if (isModelUnavailable(error) || isRetryable(error)) break;
          throw mapOpenRouterError(error);
        }
      }
    }

    throw mapOpenRouterError(lastError);
  },
};

module.exports = aiService;
