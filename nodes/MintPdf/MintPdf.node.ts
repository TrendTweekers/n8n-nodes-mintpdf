import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { buildPdfRequestBody, type MintPdfOperation } from './buildBody';

/** Turns a non-2xx MintPDF response into a readable message, keeping the API's own hint text. */
function describeApiError(statusCode: number, rawBody: unknown): { message: string; description?: string } {
	let parsed: IDataObject = {};
	try {
		const text =
			rawBody instanceof ArrayBuffer || ArrayBuffer.isView(rawBody)
				? new TextDecoder().decode(rawBody as ArrayBuffer)
				: typeof rawBody === 'string'
					? rawBody
					: JSON.stringify(rawBody ?? {});
		parsed = JSON.parse(text) as IDataObject;
	} catch {
		parsed = {};
	}
	const error = typeof parsed.error === 'string' ? parsed.error : `MintPDF returned HTTP ${statusCode}`;
	const hint = typeof parsed.hint === 'string' ? parsed.hint : undefined;
	if (statusCode === 429) {
		return {
			message: `MintPDF limit reached: ${error}`,
			description:
				hint ??
				'Use an API key with a larger plan. See https://mintpdf.dev/#pricing for plans.',
		};
	}
	return { message: `MintPDF error (HTTP ${statusCode}): ${error}`, description: hint };
}

export class MintPdf implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'MintPDF',
		name: 'mintPdf',
		icon: { light: 'file:mintpdf.svg', dark: 'file:mintpdf.dark.svg' },
		group: ['transform'],
		version: [1],
		subtitle: '={{$parameter["operation"]}}',
		description: 'Convert HTML, Markdown or a public URL to PDF with the MintPDF API',
		defaults: {
			name: 'MintPDF',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'mintPdfApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'HTML to PDF',
						value: 'htmlToPdf',
						description: 'Render an HTML document to PDF',
						action: 'Convert HTML to PDF',
					},
					{
						name: 'Markdown to PDF',
						value: 'markdownToPdf',
						description: 'Render GitHub-flavoured Markdown to a styled PDF',
						action: 'Convert markdown to PDF',
					},
					{
						name: 'URL to PDF',
						value: 'urlToPdf',
						description: 'Render a public web page to PDF',
						action: 'Convert a URL to PDF',
					},
				],
				default: 'htmlToPdf',
			},
			{
				displayName: 'HTML',
				name: 'html',
				type: 'string',
				typeOptions: { rows: 8 },
				required: true,
				default: '',
				placeholder: '<h1>Invoice #42</h1>',
				description: 'The HTML to render. It is rendered exactly as sent.',
				displayOptions: { show: { operation: ['htmlToPdf'] } },
			},
			{
				displayName: 'Markdown',
				name: 'markdown',
				type: 'string',
				typeOptions: { rows: 8 },
				required: true,
				default: '',
				placeholder: '# Invoice #42',
				description:
					'GitHub-flavoured Markdown. Tables, fenced code, Mermaid diagrams and KaTeX maths are supported.',
				displayOptions: { show: { operation: ['markdownToPdf'] } },
			},
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'https://example.com',
				description:
					'A public page to render. Private and internal network addresses are blocked. The renderer waits for the network to go idle before printing.',
				displayOptions: { show: { operation: ['urlToPdf'] } },
			},
			{
				displayName: 'Return As',
				name: 'returnAs',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Binary File',
						value: 'binary',
						description: 'Attach the PDF to the item as binary data',
					},
					{
						name: 'Download URL',
						value: 'url',
						description: 'Return a link to the PDF that is valid for one hour',
					},
				],
				default: 'binary',
			},
			{
				displayName: 'Put Output File in Field',
				name: 'binaryPropertyName',
				type: 'string',
				required: true,
				default: 'data',
				hint: 'The name of the output binary field to put the PDF in',
				displayOptions: { show: { returnAs: ['binary'] } },
			},
			{
				displayName: 'File Name',
				name: 'fileName',
				type: 'string',
				default: 'document.pdf',
				description: 'File name for the binary PDF',
				displayOptions: { show: { returnAs: ['binary'] } },
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Footer Text',
						name: 'footerText',
						type: 'string',
						default: '',
						description: 'Text printed at the foot of every page',
					},
					{
						displayName: 'Header Text',
						name: 'headerText',
						type: 'string',
						default: '',
						description: 'Text printed at the top of every page',
					},
					{
						displayName: 'Landscape',
						name: 'landscape',
						type: 'boolean',
						default: false,
						description: 'Whether to print in landscape orientation',
					},
					{
						displayName: 'Margin',
						name: 'margin',
						type: 'string',
						default: '',
						placeholder: '18mm',
						description: 'Margin on all sides as a CSS length. Units: mm, cm, in, px, pt.',
					},
					{
						displayName: 'Page Numbers',
						name: 'pageNumbers',
						type: 'boolean',
						default: false,
						description: 'Whether to print page numbers',
					},
					{
						displayName: 'Paper Format',
						name: 'format',
						type: 'options',
						options: [
							{ name: 'A3', value: 'A3' },
							{ name: 'A4', value: 'A4' },
							{ name: 'A5', value: 'A5' },
							{ name: 'Legal', value: 'Legal' },
							{ name: 'Letter', value: 'Letter' },
						],
						default: 'A4',
					},
					{
						displayName: 'Print Background',
						name: 'printBackground',
						type: 'boolean',
						default: true,
						description: 'Whether to print background colours and images',
					},
					{
						displayName: 'Scale',
						name: 'scale',
						type: 'number',
						typeOptions: { minValue: 0.1, maxValue: 2, numberPrecision: 2 },
						default: 1,
						description: 'Rendering scale, between 0.1 and 2',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as MintPdfOperation;
				const sourceField =
					operation === 'htmlToPdf' ? 'html' : operation === 'markdownToPdf' ? 'markdown' : 'url';
				const source = this.getNodeParameter(sourceField, i) as string;
				const returnAs = this.getNodeParameter('returnAs', i) as 'binary' | 'url';
				const options = this.getNodeParameter('options', i, {}) as IDataObject;

				const built = buildPdfRequestBody(operation, source, options, returnAs);
				if ('error' in built) {
					throw new NodeOperationError(this.getNode(), built.error, { itemIndex: i });
				}

				const credentials = await this.getCredentials('mintPdfApi', i);
				const baseUrl = String(credentials.baseUrl || 'https://mintpdf.dev').replace(/\/+$/, '');

				const request: IHttpRequestOptions = {
					method: 'POST',
					url: `${baseUrl}/v1/pdf`,
					body: built.body,
					json: true,
					returnFullResponse: true,
					ignoreHttpStatusErrors: true,
				};
				if (returnAs === 'binary') {
					request.encoding = 'arraybuffer';
					request.json = false;
					request.headers = { 'Content-Type': 'application/json', Accept: 'application/pdf' };
					request.body = JSON.stringify(built.body);
				}

				const response = (await this.helpers.httpRequestWithAuthentication.call(
					this,
					'mintPdfApi',
					request,
				)) as { statusCode: number; body: unknown; headers: IDataObject };

				if (response.statusCode >= 400) {
					const { message, description } = describeApiError(response.statusCode, response.body);
					throw new NodeApiError(
						this.getNode(),
						{ statusCode: response.statusCode, message } as JsonObject,
						{ message, description, httpCode: String(response.statusCode), itemIndex: i },
					);
				}

				if (returnAs === 'url') {
					returnData.push({
						json: response.body as IDataObject,
						pairedItem: { item: i },
					});
					continue;
				}

				const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
				const fileName = (this.getNodeParameter('fileName', i, 'document.pdf') as string) || 'document.pdf';
				const pdf = Buffer.from(response.body as ArrayBuffer);
				const binary = await this.helpers.prepareBinaryData(pdf, fileName, 'application/pdf');
				const remaining = response.headers?.['x-ratelimit-remaining'];

				returnData.push({
					json: {
						fileName,
						sizeBytes: pdf.length,
						...(remaining !== undefined ? { rateLimitRemaining: Number(remaining) } : {}),
					},
					binary: { [binaryPropertyName]: binary },
					pairedItem: { item: i },
				});
			} catch (error) {
				const nodeError =
					error instanceof NodeApiError || error instanceof NodeOperationError
						? error
						: new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: nodeError.message, details: nodeError.description ?? undefined },
						pairedItem: { item: i },
					});
					continue;
				}
				throw nodeError;
			}
		}

		return [returnData];
	}
}
