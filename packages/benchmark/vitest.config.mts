import { defineConfig } from "vitest/config";
import codspeedPlugin from "@codspeed/vitest-plugin";

export default defineConfig({
  plugins: [codspeedPlugin()],
  test: {
    benchmark: {
      include: ["./**/*.vitest-bench.*"],
    }
  }
});
