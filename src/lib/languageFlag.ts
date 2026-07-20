/**
 * Map ISO 639-1 language codes to a representative ISO 3166-1 alpha-2 region
 * for emoji flag display. Choices are conventional, not political.
 */
const languageToRegion: Record<string, string> = {
	// Major languages
	en: 'GB',
	zh: 'CN',
	'zh-cn': 'CN',
	'zh-tw': 'TW',
	'zh-hk': 'HK',
	ja: 'JP',
	ko: 'KR',
	ru: 'RU',
	ar: 'SA',
	he: 'IL',
	hi: 'IN',
	bn: 'BD',
	ur: 'PK',
	fa: 'IR',
	tr: 'TR',
	vi: 'VN',
	th: 'TH',
	id: 'ID',
	ms: 'MY',
	tl: 'PH',
	fil: 'PH',
	sw: 'KE',

	// European
	fr: 'FR',
	de: 'DE',
	es: 'ES',
	it: 'IT',
	pt: 'PT',
	'pt-br': 'BR',
	nl: 'NL',
	pl: 'PL',
	uk: 'UA',
	cs: 'CZ',
	sk: 'SK',
	hu: 'HU',
	ro: 'RO',
	bg: 'BG',
	el: 'GR',
	sv: 'SE',
	no: 'NO',
	nb: 'NO',
	nn: 'NO',
	da: 'DK',
	fi: 'FI',
	is: 'IS',
	et: 'EE',
	lv: 'LV',
	lt: 'LT',
	sl: 'SI',
	hr: 'HR',
	sr: 'RS',
	bs: 'BA',
	mk: 'MK',
	sq: 'AL',
	mt: 'MT',
	ga: 'IE',
	cy: 'GB',
	eu: 'ES',
	ca: 'ES',
	gl: 'ES',
	be: 'BY',

	// Others commonly supported by translators
	af: 'ZA',
	am: 'ET',
	az: 'AZ',
	ka: 'GE',
	hy: 'AM',
	kk: 'KZ',
	ky: 'KG',
	uz: 'UZ',
	tg: 'TJ',
	mn: 'MN',
	ne: 'NP',
	si: 'LK',
	ta: 'IN',
	te: 'IN',
	ml: 'IN',
	kn: 'IN',
	mr: 'IN',
	gu: 'IN',
	pa: 'IN',
	my: 'MM',
	km: 'KH',
	lo: 'LA',
	jw: 'ID',
	jv: 'ID',
	su: 'ID',
	ha: 'NG',
	yo: 'NG',
	ig: 'NG',
	zu: 'ZA',
	xh: 'ZA',
	so: 'SO',
	ps: 'AF',
	ku: 'IQ',
	ckb: 'IQ',
	yi: 'IL',
	lb: 'LU',
	fy: 'NL',
	gd: 'GB',
	co: 'FR',
	ht: 'HT',
	haw: 'US',
	sm: 'WS',
	mi: 'NZ',
	mg: 'MG',
	ny: 'MW',
	sn: 'ZW',
	st: 'LS',
	tn: 'BW',
	rw: 'RW',
	eo: '', // constructed — no flag
	la: 'VA',
	sa: 'IN',
	ceb: 'PH',
	hmn: 'CN',
};

/**
 * Convert ISO 3166-1 alpha-2 region code to a flag emoji via regional indicators.
 * Returns empty string for invalid input.
 */
const regionToFlagEmoji = (region: string): string => {
	if (!/^[A-Za-z]{2}$/.test(region)) return '';

	const upper = region.toUpperCase();
	// Regional Indicator Symbol Letter A is U+1F1E6; 'A'.charCodeAt(0) === 65
	const first = 0x1f1e6 + (upper.charCodeAt(0) - 65);
	const second = 0x1f1e6 + (upper.charCodeAt(1) - 65);
	return String.fromCodePoint(first, second);
};

/**
 * Return a representative flag emoji for a language code, or 🌐 for auto/unknown.
 * Never throws; safe for Select labels.
 */
export const getLanguageFlagEmoji = (langCode: string): string => {
	if (!langCode || langCode === 'auto') {
		return '🌐';
	}

	const normalized = langCode.trim().toLowerCase().replace(/_/g, '-');

	// Exact match (including region-tagged codes like pt-br)
	const exact = languageToRegion[normalized];
	if (exact !== undefined) {
		return exact ? regionToFlagEmoji(exact) : '🌐';
	}

	// Base language (e.g. en-US → en)
	const base = normalized.split('-')[0];
	const baseRegion = languageToRegion[base];
	if (baseRegion !== undefined) {
		return baseRegion ? regionToFlagEmoji(baseRegion) : '🌐';
	}

	// If the code itself looks like a region (rare), try it
	if (/^[a-z]{2}$/.test(base)) {
		// Unknown ISO 639-1 — no reliable region
		return '🌐';
	}

	return '🌐';
};

/**
 * Format a language label with an optional leading flag emoji.
 */
export const formatLanguageLabel = (langCode: string, name: string): string => {
	const flag = getLanguageFlagEmoji(langCode);
	return flag ? `${flag} ${name}` : name;
};
