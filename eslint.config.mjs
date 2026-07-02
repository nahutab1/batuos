import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Catch block'ta error tipini belirlemek icin any'e izin ver
      "@typescript-eslint/no-explicit-any": "warn",
      // Bot.js polling fonksiyonu hook degil, false positive
      "react-hooks/rules-of-hooks": "off",
    },
  },
]);

export default eslintConfig;
