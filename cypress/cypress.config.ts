import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    supportFile: "cypress/support/e2e.ts",
    specPattern: "cypress/integration/**/*.spec.ts",
    video: false,
    screenshotOnRunFailure: true,
  },
  component: {
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
  },
});
