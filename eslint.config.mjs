import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import globals from "globals";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
  {
    rules: {
      // Whitespace rules (Prettier handles formatting, ESLint handles logic)
      "no-trailing-spaces": "error",
      "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0 }],
      "eol-last": ["error", "always"],
      // Disable prop-types since we're using TypeScript/JSX without PropTypes
      "react/prop-types": "off",
      // Disable some accessibility warnings for now
      "jsx-a11y/label-has-associated-control": "warn",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },
];

export default eslintConfig;
