module.exports = {
  root: true,
  extends: ["@react-native", "prettier"],
  plugins: ["simple-import-sort"],
  rules: {
    "@typescript-eslint/no-shadow": "off",
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
  },
};
