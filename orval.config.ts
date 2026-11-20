import { defineConfig } from "orval";

export default defineConfig({
  portfolio: {
    input: "./api/openapi.yaml",
    output: {
      client: "fetch",
      target: "./src/generated/portfolio.ts",
    },
  },
});
