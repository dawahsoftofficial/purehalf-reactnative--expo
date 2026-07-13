module.exports = {
  '**/*.{js,jsx,ts,tsx}': (filenames) => {
    // Filter out index.js (entry point with JSX in .js file)
    const filesToLint = filenames.filter((f) => f !== 'index.js');
    if (filesToLint.length === 0) return [];
    return [
      `npx eslint --fix ${filesToLint
        .map((filename) => `"${filename}"`)
        .join(' ')}`,
    ];
  },
  '**/*.(md|json)': (filenames) =>
    `npx prettier --write ${filenames
      .map((filename) => `"${filename}"`)
      .join(' ')}`,
  'src/translations/*.(json)': (filenames) => [
    `npx eslint --fix ${filenames
      .map((filename) => `"${filename}"`)
      .join(' ')}`,
  ],
};
