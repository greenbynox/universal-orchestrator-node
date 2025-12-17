import os from 'os';
import path from 'path';
import fs from 'fs';

describe('settingsStore', () => {
  const tmpDir = path.join(os.tmpdir(), `orchestrator-settings-test-${Date.now()}`);

  beforeAll(() => {
    process.env.DATA_PATH = tmpDir;
    // Ensure clean module graph so config picks up DATA_PATH
    jest.resetModules();
  });

  afterAll(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  test('saveSettingsToDisk + loadSettingsFromDisk roundtrip', () => {
    const { saveSettingsToDisk, loadSettingsFromDisk } = require('../src/core/settingsStore');

    const input = {
      dockerMaxRetries: 12,
      dockerRetryDelayMs: 1234,
      skipDockerCheck: true,
      apiAuthMode: 'token',
      apiToken: 'test-token-123',
      allowedOrigins: 'http://localhost:5173',
      alertMinSeverity: 'warning',
    };

    saveSettingsToDisk(input);

    const loaded = loadSettingsFromDisk();
    expect(loaded.dockerMaxRetries).toBe(12);
    expect(loaded.dockerRetryDelayMs).toBe(1234);
    expect(loaded.skipDockerCheck).toBe(true);
    expect(loaded.apiAuthMode).toBe('token');
    expect(loaded.apiToken).toBe('test-token-123');
    expect(loaded.allowedOrigins).toBe('http://localhost:5173');
    expect(loaded.alertMinSeverity).toBe('warning');
  });

  test('applyRuntimeSettings mutates config/env', () => {
    const { applyRuntimeSettings, getCurrentRuntimeSettings } = require('../src/core/settingsStore');

    applyRuntimeSettings({
      apiRateLimitEnabled: false,
      apiAuthMode: 'basic',
      apiBasicUser: 'admin',
      apiBasicPass: 'pass',
      nodeMaxConcurrent: 5,
      alertCpuThreshold: 77,
      allowedOrigins: 'http://a.test,http://b.test',
    });

    const current = getCurrentRuntimeSettings();
    expect(current.apiRateLimitEnabled).toBe(false);
    expect(current.apiAuthMode).toBe('basic');
    expect(current.apiBasicUser).toBe('admin');
    expect(current.apiBasicPass).toBe('pass');
    expect(current.nodeMaxConcurrent).toBe(5);
    expect(current.alertCpuThreshold).toBe(77);
    expect(current.allowedOrigins).toBe('http://a.test,http://b.test');

    expect(process.env.API_RATE_LIMIT_ENABLED).toBe('false');
    expect(process.env.API_AUTH_MODE).toBe('basic');
    expect(process.env.API_BASIC_USER).toBe('admin');
    expect(process.env.API_BASIC_PASS).toBe('pass');
    expect(process.env.NODE_MAX_CONCURRENT).toBe('5');
    expect(process.env.ALERT_CPU_THRESHOLD).toBe('77');
    expect(process.env.ALLOWED_ORIGINS).toBe('http://a.test,http://b.test');
  });
});
