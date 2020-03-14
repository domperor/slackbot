module.exports = {
	transform: {
		'^.+\\.tsx?$': 'ts-jest',
	},
	testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[tj]s$',
	collectCoverageFrom: [
		'**/*.{js,ts}',
		'!**/*.test.{js,ts}',
	],
	coveragePathIgnorePatterns: [
		'coverage',
		'/node_modules/',
	],
};