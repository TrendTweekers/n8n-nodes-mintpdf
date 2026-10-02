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
	 * MintPDF has no authenticated endpoint that is free to call: every POST /v1/pdf spends a
	 * render, and an unknown key is served as anonymous rather than rejected. So the test only
	 * confirms that a MintPDF server answers at the base URL. The key is checked on the first render.
	 */
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{String($credentials.baseUrl || "https://mintpdf.dev").replace(/\\/+$/, "")}}',
			url: '/health',
			method: 'GET',
		},
		rules: [
			{
				type: 'responseSuccessBody',
				properties: {
					key: 'ok',
					value: false,
					message: 'No MintPDF server answered at this base URL',
				},
			},
		],
	};
}
