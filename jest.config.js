export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  // テストファイルは *.test.ts(x) / *.spec.ts(x) のみを対象にする。
  // __tests__ 配下にある実行ヘルパー(TestRunner.ts, RunIntegrationTests.ts)は
  // describe/it を持たないため、これにより対象外になる。
  testMatch: [
    '<rootDir>/src/**/*.(test|spec).(ts|tsx)',
  ],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        esModuleInterop: true
      }
    }]
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 90,
      lines: 80,
      statements: 80,
    },
  },
  testTimeout: 10000,
  // Watchモードを無効化
  watchman: false,
  // CIモードで実行（watchモードを無効化）
  ci: true,
};