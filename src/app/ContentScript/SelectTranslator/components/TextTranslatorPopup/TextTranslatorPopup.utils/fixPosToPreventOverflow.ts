import { AnchorRect } from './getSelectionAnchorRect';

/**
 * Clamp an anchor rect so it stays within the current page/viewport.
 * Keeps width/height unchanged; only shifts origin when necessary.
 */
export const fixPosToPreventOverflow = (rect: AnchorRect): AnchorRect => {
	const viewportWidth = document.documentElement.clientWidth;
	const pageHeight = document.documentElement.scrollHeight;

	let { left, top } = rect;
	const { width, height } = rect;

	// Keep some of the anchor inside the horizontal viewport
	if (left + width < 0) {
		left = 0;
	} else if (left > viewportWidth) {
		left = Math.max(0, viewportWidth - Math.max(width, 1));
	}

	// Keep some of the anchor inside the page vertically
	if (top + height < 0) {
		top = 0;
	} else if (top > pageHeight) {
		top = Math.max(0, pageHeight - Math.max(height, 1));
	}

	return { left, top, width, height };
};
