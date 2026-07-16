import { defineConfig, mergeConfig } from "vitest/config";

import { sharedVitestConfig } from "@readhub/config/vitest.shared";

export default mergeConfig(defineConfig(sharedVitestConfig), defineConfig({}));
