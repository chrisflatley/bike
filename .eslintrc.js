module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2019
    },
    plugins: [
        '@typescript-eslint',
        'jest',
        'node',
        'import',
        'eslint-comments'
    ],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier',
        // 'plugin:node/recommended',
        'plugin:jest/recommended',
        // 'plugin:import/recommended',
        'plugin:eslint-comments/recommended'
    ],
};