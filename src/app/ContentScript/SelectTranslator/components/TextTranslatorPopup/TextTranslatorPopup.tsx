import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isKeyCode, Keys } from 'react-elegant-ui/esm/lib/keyboard';
import { cn } from '@bem-react/classname';

import { Modal } from '../../../../../components/primitives/Modal/Modal.bundle/desktop';
import { Popup } from '../../../../../components/primitives/Popup/Popup';
import { isMobileBrowser } from '../../../../../lib/browser';
import LogoElement from '../../../../../res/logo-icon.svg';
import { theme } from '../../../../../themes/presets/default/desktop';

import {
	TextTranslator,
	TextTranslatorComponentProps,
} from './TextTranslator/TextTranslator';
import { fixPosToPreventOverflow } from './TextTranslatorPopup.utils/fixPosToPreventOverflow';
import { AnchorRect } from './TextTranslatorPopup.utils/getSelectionAnchorRect';

import './TextTranslatorPopup.css';

export interface TextTranslatorPopupProps
	extends Omit<TextTranslatorComponentProps, 'updatePopup'> {
	/**
	 * Root-relative selection rect used as the popup anchor
	 */
	anchor: AnchorRect;
	timeoutForHideButton?: number;
	zIndex?: number;
	quickTranslate?: boolean;
	focusOnTranslateButton?: boolean;
	/**
	 * Opacity of the selection TextTranslator popup card (0–1)
	 */
	opacity?: number;

	closeHandler: () => void;
}

const cnTheme = cn('Theme');
const cnTextTranslatorPopup = cn('TextTranslatorPopup');

// Prefer above/below the selection, similar to Google Translate.
// left/right are last-resort fallbacks when vertical space is tight.
const SELECTION_POPUP_DIRECTIONS = [
	'top',
	'top-start',
	'top-end',
	'bottom',
	'bottom-start',
	'bottom-end',
	'right',
	'left',
] as const;

// TODO: split styles
export const TextTranslatorPopup: FC<TextTranslatorPopupProps> = ({
	anchor,
	zIndex,
	timeoutForHideButton,
	quickTranslate = false,
	focusOnTranslateButton = false,
	opacity = 0.95,
	closeHandler,
	...props
}) => {
	const [translating, setTranslating] = useState(quickTranslate);

	const isUnmount = useRef(false);
	const autoCloseTimeout = useRef<number | null>(null);
	// Ref so pointerdown/click can disable auto-hide before React re-renders
	// with `translating === true`.
	const isOpeningOrTranslatingRef = useRef(quickTranslate);

	const toggleAutoclose = useCallback(
		(enable: boolean) => {
			const isEnabled = autoCloseTimeout.current !== null;

			// Skip if same state
			if (enable === isEnabled) return;

			// Never re-arm auto-hide once the user has engaged the button / card.
			if (enable && isOpeningOrTranslatingRef.current) return;

			// Clear timeout
			if (autoCloseTimeout.current !== null) {
				window.clearTimeout(autoCloseTimeout.current);
				autoCloseTimeout.current = null;
			}

			if (enable) {
				if (timeoutForHideButton !== undefined && timeoutForHideButton > 0) {
					autoCloseTimeout.current = window.setTimeout(() => {
						if (!isUnmount.current && !isOpeningOrTranslatingRef.current) {
							closeHandler();
						}
					}, timeoutForHideButton);
				}
			}
		},
		[closeHandler, timeoutForHideButton],
	);

	const doTranslate = useCallback(() => {
		if (!translating) {
			// Stop auto-hide before opening the card so a late timeout can't
			// race the click and unmount the popup.
			isOpeningOrTranslatingRef.current = true;
			toggleAutoclose(false);
			setTranslating(true);
		}
	}, [toggleAutoclose, translating]);

	// Init
	useEffect(() => {
		// Enable hide button by timeout if not already translating
		if (!translating) {
			toggleAutoclose(true);
		}

		return () => {
			isUnmount.current = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (translating) {
			toggleAutoclose(false);
		}
	}, [toggleAutoclose, translating]);

	const updateRef = useRef<() => void | null>(null);
	const updateHook = useCallback(() => {
		if (updateRef.current) {
			updateRef.current();
		}
	}, []);

	const cursorRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const translateButtonRef = useRef<HTMLDivElement>(null);

	// LayerManager (via Popup) closes on document click/ESC. Clicks inside a
	// closed shadow root surface on document listeners with `event.target`
	// equal to the host, so `popup.contains(event.target)` is false and
	// LayerManager can treat them as outside. Drop those false positives; real
	// outside presses still close via SelectTranslator.pointerDown (icon) /
	// LayerManager (card). Capture phase also runs before React commits
	// `doTranslate`, so ignore click closes while still in button mode.
	const handlePopupClose = useCallback(
		(event: KeyboardEvent | MouseEvent, source: 'esc' | 'click') => {
			if (source === 'click') {
				if (!translating) return;

				const inner =
					containerRef.current ??
					translateButtonRef.current ??
					cursorRef.current;
				if (inner && event.target instanceof Node) {
					const root = inner.getRootNode();
					// Closed-shadow click: target is the host on document listeners
					if (root instanceof ShadowRoot && event.target === root.host) {
						return;
					}
					if (inner === event.target || inner.contains(event.target)) {
						return;
					}
				}
			}
			closeHandler();
		},
		[closeHandler, translating],
	);

	const cursorStyle: React.CSSProperties = useMemo(() => {
		const { left, top, width, height } = fixPosToPreventOverflow(anchor);

		return {
			position: 'absolute',
			left: left + 'px',
			top: top + 'px',
			width: Math.max(width, 1) + 'px',
			height: Math.max(height, 1) + 'px',
			pointerEvents: 'none',
			visibility: 'hidden',
		};
	}, [anchor]);

	const modifiers = useMemo(
		() => [
			{ name: 'hide', enabled: false },
			{
				// Compute as simply as possible, use only top and left
				// Otherwise, with use `inset` may be invalid position
				// Mod docs: https://popper.js.org/docs/v2/modifiers/compute-styles/#adaptive
				name: 'computeStyles',
				options: {
					gpuAcceleration: false,
					adaptive: false,
				},
			},
		],
		[],
	);

	const focusTranslateButton = useCallback(() => {
		if (!translateButtonRef.current) return false;

		const btn = translateButtonRef.current;
		btn.focus();

		// Focus again after loading
		const focusAfterLoad = () => {
			btn.focus();
			btn.removeEventListener('load', focusAfterLoad);
		};

		btn.addEventListener('load', focusAfterLoad);

		return true;
	}, []);

	const focusRootContainer = useCallback(() => {
		if (!containerRef.current) return false;

		containerRef.current.focus();

		return true;
	}, []);

	// Components after render will change position and size,
	// we wait it and update state
	const [isComponentLoaded, setIsComponentLoaded] = useState(false);
	useEffect(() => {
		// Wait 1 frame after render
		requestAnimationFrame(() => {
			setIsComponentLoaded(true);
		});
	}, []);

	// Focus by load component and by change state
	useEffect(() => {
		// Skip if component did not load
		if (!isComponentLoaded) return;

		if (translating) {
			focusRootContainer();
		} else if (focusOnTranslateButton) {
			// Focus on button right after selection
			focusTranslateButton();
		}
	}, [
		isComponentLoaded,
		translating,
		focusOnTranslateButton,
		focusRootContainer,
		focusTranslateButton,
	]);

	const isMobile = useMemo(() => isMobileBrowser(), []);

	const clampedOpacity = Math.min(1, Math.max(0, opacity));

	const content = (
		<div
			tabIndex={0}
			ref={containerRef}
			style={translating ? { opacity: clampedOpacity } : undefined}
		>
			{translating ? (
				<TextTranslator {...props} updatePopup={updateHook} />
			) : (
				<div
					tabIndex={0}
					ref={translateButtonRef}
					onKeyDown={(evt) => {
						if (isKeyCode(evt.code, [Keys.ENTER, Keys.SPACE])) {
							evt.preventDefault();
							doTranslate();
						}
					}}
					// pointerdown runs before document-level click handlers and before
					// selection-clearing side effects; cancel auto-hide immediately
					// and mark intent so a late mouseleave can't re-arm the timer.
					onPointerDown={() => {
						isOpeningOrTranslatingRef.current = true;
						toggleAutoclose(false);
					}}
					onClick={doTranslate}
					onMouseOver={() => {
						toggleAutoclose(false);
					}}
					onMouseLeave={() => {
						toggleAutoclose(true);
					}}
				>
					<LogoElement className={cnTextTranslatorPopup('TranslateButton')} />
				</div>
			)}
		</div>
	);

	// Mobile view
	if (isMobile && translating) {
		return (
			<div className={cnTextTranslatorPopup({ mobile: true }, [cnTheme(theme)])}>
				<Modal
					view="default"
					visible
					preventBodyScroll
					zIndex={zIndex}
					onClose={closeHandler}
				>
					{content}
				</Modal>
			</div>
		);
	}

	// Render an invisible rect matching the selection and attach popup to it.
	// We use a real node (not a virtual element) so positioning behaves like
	// `position: absolute` rather than `fixed`.
	return (
		<>
			{/* Selection anchor */}
			<div style={cursorStyle} ref={cursorRef} />

			{/* Render popup attached to selection */}
			<div className={cnTextTranslatorPopup({}, [cnTheme(theme)])}>
				<Popup
					target="anchor"
					anchor={cursorRef}
					// Prefer above, then below the selection (Google Translate style)
					direction={[...SELECTION_POPUP_DIRECTIONS]}
					mainOffset={8}
					visible={true}
					zIndex={zIndex}
					modifiers={modifiers}
					onClose={handlePopupClose}
					view={translating ? 'default' : undefined}
					UNSTABLE_updatePosition={updateRef}
				>
					{content}
				</Popup>
			</div>
		</>
	);
};
