import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: [
      "content/spec/**",
      "content/skills/**",
      ".next/**",
      "node_modules/**",
      "scripts/bakeoff/**",
    ],
  },
];

export default eslintConfig;
