import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  await viteConfig(),
  defineConfig({
    test: {
      environment: "jsdom",
      globals: true,
      css: false,
      setupFiles: ["src/test/setup.ts"],
    },
  })
);
