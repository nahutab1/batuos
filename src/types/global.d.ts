// Global type declarations for Node.js environment

export {};

declare global {
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
