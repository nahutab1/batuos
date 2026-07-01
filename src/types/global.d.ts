// Global type declarations for Node.js environment

export {};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      batuosSettings?: {
        supabaseUrl?: string;
        geminiApiKey?: string;
        telegramBotToken?: string;
        telegramWebhookSecret?: string;
      };
    }
  }
}
