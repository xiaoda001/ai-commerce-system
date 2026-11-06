module.exports = {
  testRegex: 'test/.*\\.spec\\.ts$',
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
  testEnvironment: 'node'
};
