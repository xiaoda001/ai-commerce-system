module.exports = {
  testRegex: '(src/.*\\.spec\\.ts$|test/.*\\.e2e-spec\\.ts$)',
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
  testEnvironment: 'node'
};
