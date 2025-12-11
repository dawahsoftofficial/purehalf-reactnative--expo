import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig, globalIgnores } from 'eslint/config';
import i18nJsonPlugin from 'eslint-plugin-i18n-json';
import importPlugin from 'eslint-plugin-import';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactNative from 'eslint-plugin-react-native';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import reactCompiler from 'eslint-plugin-react-compiler';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import testingLibrary from 'eslint-plugin-testing-library';
// eslint-disable-next-line import/no-named-as-default, import/no-named-as-default-member, import/namespace
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import unusedImports from 'eslint-plugin-unused-imports';
import { configs, parser } from 'typescript-eslint';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig([
  globalIgnores([
    'dist/*',
    'node_modules/**',
    '__tests__/',
    'coverage',
    '.expo',
    '.expo-shared',
    'android',
    'ios',
    '.vscode',
    'docs/',
    'cli/',
    'expo-env.d.ts',
  ]),
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        __dirname: 'readonly',
        __filename: 'readonly',
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        global: 'readonly',
      },
    },
    rules: {
      'no-console': 'warn',
      'no-unused-vars': 'warn',
    },
  },
  eslintPluginPrettierRecommended,
  reactCompiler.configs.recommended,
  {
    plugins: {
      react: react,
      'react-hooks': reactHooks,
      'react-native': reactNative,
      import: importPlugin,
      'simple-import-sort': simpleImportSort,
      unicorn: eslintPluginUnicorn,
      'unused-imports': unusedImports,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'max-params': ['error', 3],
      'max-lines-per-function': ['error', 70],
      'react/display-name': 'off',
      'react/no-inline-styles': 'off',
      'react/destructuring-assignment': 'off',
      'react/require-default-props': 'off',
      'react/react-in-jsx-scope': 'off',
      'unicorn/filename-case': [
        'error',
        {
          case: 'kebabCase',
          ignore: ['/android', '/ios', 'App.tsx', 'index.ts', 'index.tsx'],
        },
      ],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'import/prefer-default-export': 'off',
      'import/no-cycle': ['error', { maxDepth: '∞' }],
      'prettier/prettier': ['error', { ignores: ['expo-env.d.ts'] }],
    },
  },
  ...configs.recommended.map((config) => ({
    ...config,
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['node_modules/**', '**/node_modules/**'],
  })),
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['node_modules/**', '**/node_modules/**'],
    languageOptions: {
      parser: parser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
      },
    },
    rules: {
      '@typescript-eslint/comma-dangle': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
          disallowTypeAnnotations: true,
        },
      ],
    },
  },
  {
    files: ['src/translations/*.json'],
    plugins: { 'i18n-json': i18nJsonPlugin },
    processor: {
      meta: { name: '.json' },
      ...i18nJsonPlugin.processors['.json'],
    },
    rules: {
      ...i18nJsonPlugin.configs.recommended.rules,
      'i18n-json/valid-message-syntax': [
        2,
        {
          syntax: path.resolve(
            __dirname,
            './scripts/i18next-syntax-validation.js'
          ),
        },
      ],
      'i18n-json/valid-json': 2,
      'i18n-json/sorted-keys': [
        2,
        {
          order: 'asc',
          indentSpaces: 2,
        },
      ],
      'i18n-json/identical-keys': [
        2,
        {
          filePath: path.resolve(__dirname, './src/translations/en.json'),
        },
      ],
      'prettier/prettier': [
        0,
        {
          singleQuote: true,
          endOfLine: 'auto',
        },
      ],
    },
  },
  {
    files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
    plugins: { 'testing-library': testingLibrary },
    rules: {
      ...testingLibrary.configs.react.rules,
    },
  },
]);
