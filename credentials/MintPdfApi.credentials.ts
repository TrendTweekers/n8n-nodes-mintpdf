import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class MintPdfApi implements ICredentialType {
	name = 'mintPdfApi';

	displayName = 'MintPDF API';

	icon: Icon = { light: 'file:mintpdf.svg', dark: 'file:mintpdf.dark.svg' };

	documentationUrl = 'https://mintpdf.dev';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description:
				'Your MintPDF API key. Get a free key (100 renders a month, email only, no card) at https://mintpdf.dev or with POST https://mintpdf.dev/v1/keys.',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://mintpdf.dev',
			description:
				'Leave as is for the hosted service. Change it only if you run your own MintPDF server.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	/**
	 * GET /v1/me costs nothing and returns 401 for a missing or unknown key, so a failed test
	 * means the key is wrong (or no MintPDF server answers at the base URL).
	 */
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{String($credentials.baseUrl || "https://mintpdf.dev").replace(/\\/+$/, "")}}',
			url: '/v1/me',
			method: 'GET',
		},
	};
}
