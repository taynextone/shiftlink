module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  // e2e/*.spec.ts are Playwright tests - they must run via "npx playwright test",
  // not Jest (Playwright errors out if loaded by the Jest runner).
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        target: 'ES2022',
        module: 'CommonJS',
        moduleResolution: 'Node',
        jsx: 'react-jsx',
        esModuleInterop: true,
        isolatedModules: true,
        skipLibCheck: true,
        ignoreDeprecations: '6.0',
      },
    }],
  },
};
