#!/usr/bin/env node
import { spawn, execSync } from "child_process";
const scripts = ["warp.sh", "xray.sh", "start.sh"];

for (const script of scripts) {
  const bashProcess = spawn("bash", [script], {
    stdio: "inherit",
    env: { HY2_PORT: 20143 },
  });
  bashProcess.stdout?.on("data", (data) => {
    console.log(`data to start ${script}:`, data);
  });
  bashProcess.stderr?.on("data", (data) => {
    console.error(`stderr to start ${script}:`, data);
  });
  bashProcess.on("error", (error) => {
    console.error(`Failed to start ${script}:`, error);
  });

  bashProcess.on("close", (code) => {
    if (code !== 0) {
      console.error(`${script} exited with code ${code}`);
    } else {
      console.log(`${script} completed successfully`);
    }
  });
}
