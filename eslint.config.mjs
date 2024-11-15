export default {
  env: {
    node: true,  // Enables Node.js globals like 'require', 'module', and 'process'
    jest: true,  // Enables Jest globals like 'describe', 'test', 'expect'
  },
  extends: [
    "eslint:recommended", // ESLint's recommended rules
    "plugin:react/recommended", // Optional: if using React
  ],
  parserOptions: {
    ecmaVersion: 2020, // Allows modern JavaScript features
    sourceType: "module", // Enables ES module syntax
  },
  rules: {
    "no-undef": "error",  // Enforces the usage of defined variables
  },
};