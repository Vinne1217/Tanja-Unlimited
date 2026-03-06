// Jest configuration for campaignRoutes tests
// Supports both CommonJS and ES modules
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.test.js', '**/*.test.js'],
  collectCoverageFrom: [
    'routes/**/*.js',
    '!**/node_modules/**',
    '!**/__tests__/**'
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  // Handle both CommonJS and ES modules
  transform: {},
  moduleFileExtensions: ['js', 'json'],
  testTimeout: 10000
};
