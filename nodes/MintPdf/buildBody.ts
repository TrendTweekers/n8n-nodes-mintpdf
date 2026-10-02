import type { IDataObject } from 'n8n-workflow';

export type MintPdfOperation = 'htmlToPdf' | 'markdownToPdf' | 'urlToPdf';

export const SOURCE_FIELD: Record<MintPdfOperation, 'html' | 'markdown' | 'url'> = {
	htmlToPdf: 'html',
	markdownToPdf: 'markdown',
	urlToPdf: 'url',
};

const PAPER_FORMATS = ['A4', 'Letter', 'Legal', 'A3', 'A5'];
const MARGIN_PATTERN = /^\d+(\.\d+)?(mm|cm|in|px|pt)$/;
const OPTION_KEYS = [
	'format',
	'landscape',
	'scale',
	'margin',
	'printBackground',
	'headerText',
	'footerText',
	'pageNumbers',
];

/**
 * Builds the JSON body for POST /v1/pdf. Returns an error string instead of a body when the
 * input would be rejected by the API, so the user sees the problem before a render is spent.
 */
export function buildPdfRequestBody(
	operation: MintPdfOperation,
	source: string,
	options: IDataObject,
	returnAs: 'binary' | 'url',
): { body: IDataObject } | { error: string } {
	const field = SOURCE_FIELD[operation];
	if (!field) return { error: `Unknown operation: ${operation}` };
	if (typeof source !== 'string' || source.trim() === '') {
		return { error: `The ${field === 'url' ? 'URL' : field === 'html' ? 'HTML' : 'Markdown'} field is empty` };
	}

	const body: IDataObject = { [field]: source };
	for (const key of OPTION_KEYS) {
		const value = options[key];
		if (value === undefined || value === '') continue;
		body[key] = value;
	}

	if (body.format !== undefined && !PAPER_FORMATS.includes(String(body.format))) {
		return { error: `Format must be one of ${PAPER_FORMATS.join(', ')}` };
	}
	if (body.scale !== undefined) {
		const scale = Number(body.scale);
		if (!Number.isFinite(scale) || scale < 0.1 || scale > 2) {
			return { error: 'Scale must be a number between 0.1 and 2' };
		}
		body.scale = scale;
	}
	if (body.margin !== undefined) {
		body.margin = String(body.margin).trim();
		if (!MARGIN_PATTERN.test(body.margin as string)) {
			return { error: 'Margin must be a CSS length such as "18mm" (units: mm, cm, in, px, pt)' };
		}
	}

	if (returnAs === 'url') body.output = 'url';
	return { body };
}
