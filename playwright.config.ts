import { execSync } from 'node:child_process';
import { defineConfig, devices } from '@playwright/test';

// mise.toml에 고정한 Node로 서버를 띄운다. `mise exec`로 감싸면 Playwright가 서버를 종료하지 못한다.
function projectPath(): string {
  try {
    const nodeDir = execSync('mise where node', { encoding: 'utf8' }).trim();
    return `${nodeDir}/bin:${process.env.PATH}`;
  } catch {
    return process.env.PATH ?? '';
  }
}

export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL: 'http://localhost:4321' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4321',
    port: 4321,
    reuseExistingServer: false,
    // AI 에이전트 환경에서는 astro preview가 백그라운드로 분리돼 Playwright가 서버를 관리하지 못하므로 감지 변수를 비운다.
    env: { PATH: projectPath(), CLAUDECODE: '', CLAUDE_CODE_ENTRYPOINT: '', AI_AGENT: '' },
  },
});
