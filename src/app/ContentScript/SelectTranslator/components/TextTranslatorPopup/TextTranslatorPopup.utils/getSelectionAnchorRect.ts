export type AnchorRect = {
	left: number;
	top: number;
	width: number;
	height: number;
};

const toPageRect = (rect: DOMRect | DOMRectReadOnly): AnchorRect => ({
	left: rect.left + window.scrollX,
	top: rect.top + window.scrollY,
	width: rect.width,
	height: rect.height,
});

const isUsableRect = (rect: DOMRect | DOMRectReadOnly) =>
	rect.width > 0 || rect.height > 0;

/**
 * Build a page-coordinate anchor for the selection popup.
 * Prefer the selected range bounds (Google Translate style), then input element,
 * then pointer position as a last resort.
 */
export const getSelectionAnchorRect = ({
	selection,
	fallbackElement,
	pointer,
}: {
	selection?: Selection | null;
	fallbackElement?: HTMLElement | null;
	pointer?: { x: number; y: number } | null;
}): AnchorRect => {
	if (selection && selection.rangeCount > 0) {
		try {
			const range = selection.getRangeAt(0);
			const rect = range.getBoundingClientRect();
			if (isUsableRect(rect)) {
				return toPageRect(rect);
			}

			// Multi-line / collapsed edge cases: use union of client rects
			const clientRects = range.getClientRects();
			if (clientRects.length > 0) {
				let left = Infinity;
				let top = Infinity;
				let right = -Infinity;
				let bottom = -Infinity;

				for (const clientRect of Array.from(clientRects)) {
					if (!isUsableRect(clientRect)) continue;
					left = Math.min(left, clientRect.left);
					top = Math.min(top, clientRect.top);
					right = Math.max(right, clientRect.right);
					bottom = Math.max(bottom, clientRect.bottom);
				}

				if (Number.isFinite(left) && Number.isFinite(top)) {
					return {
						left: left + window.scrollX,
						top: top + window.scrollY,
						width: Math.max(0, right - left),
						height: Math.max(0, bottom - top),
					};
				}
			}
		} catch {
			// Selection can become invalid between read and rect computation
		}
	}

	if (fallbackElement) {
		const rect = fallbackElement.getBoundingClientRect();
		if (isUsableRect(rect)) {
			return toPageRect(rect);
		}
	}

	const x = pointer?.x ?? window.scrollX;
	const y = pointer?.y ?? window.scrollY;

	return {
		left: x,
		top: y,
		width: 0,
		height: 0,
	};
};
