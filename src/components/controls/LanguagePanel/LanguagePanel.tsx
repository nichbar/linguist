import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { cn } from '@bem-react/classname';

import { getLanguageNameByCode, getMessage } from '../../../lib/language';
import { formatLanguageLabel } from '../../../lib/languageFlag';
import { addRecentUsedLanguage } from '../../../requests/backend/recentUsedLanguages/addRecentUsedLanguage';
import { getRecentUsedLanguages } from '../../../requests/backend/recentUsedLanguages/getRecentUsedLanguages';
import { Button } from '../../primitives/Button/Button.bundle/desktop';
import { Icon } from '../../primitives/Icon/Icon.bundle/desktop';
import { Select } from '../../primitives/Select/Select.bundle/desktop';

import './LanguagePanel.css';

export const cnLanguagePanel = cn('LanguagePanel');

export interface LanguagePanelProps {
	languages: string[];
	from?: string;
	to?: string;
	auto?: boolean;
	setFrom?: (value?: string) => void;
	setTo?: (value?: string) => void;
	swapHandler?: (languages: { from: string; to: string }) => void;
	disableSwap?: boolean;
	preventFocusOnPress?: boolean;
	mobile?: boolean;
	/** Prefix language names with representative flag emojis */
	showFlags?: boolean;
	/** Denser layout for compact surfaces (e.g. selection popup) */
	view?: 'wide' | 'compact';
}

export const LanguagePanel: FC<LanguagePanelProps> = ({
	auto,
	languages,
	from,
	to,
	setFrom,
	setTo,
	swapHandler,
	disableSwap,
	preventFocusOnPress,
	mobile,
	showFlags = false,
	view,
}) => {
	const fromValue = from !== undefined ? from : auto ? 'auto' : languages[0];
	const toValue = to !== undefined ? to : languages[0];

	const panelView = view ?? (mobile ? 'wide' : undefined);

	const swapLanguages = () => {
		if (fromValue === 'auto') return;

		if (swapHandler !== undefined) {
			swapHandler({ from: toValue, to: fromValue });
			return;
		}

		if (setFrom !== undefined && setTo !== undefined) {
			setFrom(toValue);
			setTo(fromValue);
		}
	};

	const [recentLanguages, setRecentLanguages] = useState<string[]>([]);
	useEffect(() => {
		getRecentUsedLanguages().then(setRecentLanguages);
	}, []);

	const upLanguage = useCallback(
		(lang: string) =>
			addRecentUsedLanguage(lang).then(() => {
				getRecentUsedLanguages().then(setRecentLanguages);
			}),
		[],
	);

	const formatLabel = useCallback(
		(langCode: string) => {
			const name = getLanguageNameByCode(langCode);
			return showFlags ? formatLanguageLabel(langCode, name) : name;
		},
		[showFlags],
	);

	const options = useMemo(
		() =>
			languages
				.map((value) => ({
					id: value,
					content: formatLabel(value),
				}))
				.sort((language1, language2) => {
					// The lowest the most used
					const lang1UsageRate = recentLanguages.indexOf(language1.id);
					const lang2UsageRate = recentLanguages.indexOf(language2.id);

					// Move left the language with lowest index, but not -1
					if (lang1UsageRate !== -1 || lang2UsageRate !== -1) {
						if (lang1UsageRate === -1) return 1;
						if (lang2UsageRate === -1) return -1;

						return lang1UsageRate > lang2UsageRate ? -1 : 1;
					}

					// Sort lexicographically by bare language name (stable without flags)
					const name1 = getLanguageNameByCode(language1.id);
					const name2 = getLanguageNameByCode(language2.id);
					return name1 > name2 ? 1 : name1 < name2 ? -1 : 0;
				}),
		[formatLabel, languages, recentLanguages],
	);

	const optionsFrom = useMemo(
		() =>
			auto ? [{ id: 'auto', content: formatLabel('auto') }, ...options] : options,
		[auto, formatLabel, options],
	);

	return (
		<span className={cnLanguagePanel({ view: panelView })}>
			<Select
				options={optionsFrom}
				value={fromValue}
				setValue={useCallback(
					(value) => {
						if (typeof value !== 'string' || setFrom === undefined) return;

						setFrom(value);
						upLanguage(value);
					},
					[upLanguage, setFrom],
				)}
				className={cnLanguagePanel('Select')}
			/>
			<Button
				view="default"
				onPress={swapLanguages}
				disabled={fromValue === 'auto' || fromValue === toValue || disableSwap}
				title={getMessage('lang_swap')}
				content="icon"
				preventFocusOnPress={preventFocusOnPress}
				className={cnLanguagePanel('Button')}
				size={mobile ? 'l' : 'm'}
			>
				<Icon glyph="swap-horiz" scalable={false} />
			</Button>
			<Select
				options={options}
				value={toValue}
				setValue={useCallback(
					(value) => {
						if (typeof value !== 'string' || setTo === undefined) return;

						setTo(value);
						upLanguage(value);
					},
					[upLanguage, setTo],
				)}
				className={cnLanguagePanel('Select')}
			/>
		</span>
	);
};
