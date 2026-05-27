import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Allow inline styles for dynamic colors (e.g., theme color picker)
      "react-dom/no-unsanitized": "off",
      // Suppress CSS-in-JS warnings for dynamic values
      "@stylistic/indent": "off",
    },
  },
]);

export default eslintConfig;
