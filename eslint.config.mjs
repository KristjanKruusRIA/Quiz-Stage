import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['.vite/**', '.worktrees/**', 'content/work/**', 'node_modules/**', 'out/**'],
  },
  ...tseslint.configs.recommended,
  {
    files: ['src/renderer/**/*.tsx'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: reactHooks.configs.recommended.rules,
  },
);
