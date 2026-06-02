module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
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
