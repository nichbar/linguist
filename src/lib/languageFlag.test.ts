import { formatLanguageLabel, getLanguageFlagEmoji } from './languageFlag';

describe('getLanguageFlagEmoji', () => {
	it('returns globe for auto and empty', () => {
		expect(getLanguageFlagEmoji('auto')).toBe('🌐');
		expect(getLanguageFlagEmoji('')).toBe('🌐');
	});

	it('maps major languages to representative regions', () => {
		expect(getLanguageFlagEmoji('en')).toBe('🇬🇧');
		expect(getLanguageFlagEmoji('fr')).toBe('🇫🇷');
		expect(getLanguageFlagEmoji('zh')).toBe('🇨🇳');
		expect(getLanguageFlagEmoji('ja')).toBe('🇯🇵');
		expect(getLanguageFlagEmoji('pt-br')).toBe('🇧🇷');
		expect(getLanguageFlagEmoji('pt')).toBe('🇵🇹');
	});

	it('uses base language for unknown region tags', () => {
		expect(getLanguageFlagEmoji('en-US')).toBe('🇬🇧');
		expect(getLanguageFlagEmoji('de_AT')).toBe('🇩🇪');
	});

	it('falls back to globe for unknown codes', () => {
		expect(getLanguageFlagEmoji('xx')).toBe('🌐');
	});
});

describe('formatLanguageLabel', () => {
	it('prefixes the name with a flag', () => {
		expect(formatLanguageLabel('fr', 'French')).toBe('🇫🇷 French');
		expect(formatLanguageLabel('auto', 'Auto')).toBe('🌐 Auto');
	});
});
