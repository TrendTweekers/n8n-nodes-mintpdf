# n8n-nodes-mintpdf

This is an n8n community node. It lets you use [MintPDF](https://mintpdf.dev) in your n8n workflows.

MintPDF turns HTML, Markdown or a public web page into a PDF through a REST API. Markdown is styled by default, tables do not split across pages, and table headers repeat on every page.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation) · [Operations](#operations) · [Credentials](#credentials) · [Example](#example) · [Pricing](#pricing) · [Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

In short: in n8n, open **Settings > Community Nodes**, select **Install**, enter `n8n-nodes-mintpdf` and confirm.

## Operations

The **MintPDF** node has three operations:

- **HTML to PDF**: render an HTML document. The HTML is rendered exactly as sent.
- **Markdown to PDF**: render GitHub-flavoured Markdown to a styled PDF. Tables, fenced code blocks, Mermaid diagrams and KaTeX maths are supported.
- **URL to PDF**: render a public web page. Private and internal network addresses are blocked. The renderer waits for the network to go idle before it prints.

**Return As**

- **Binary File** (default): the PDF is attached to the item as binary data. Set the binary field name with **Put Output File in Field** (default `data`) and the name with **File Name** (default `document.pdf`). The item JSON holds `fileName`, `sizeBytes` and `rateLimitRemaining`.
- **Download URL**: the item JSON holds `download_url`, `expires_at` and `size_bytes`. The link is valid for one hour.

**Options**

| Option | Values |
|---|---|
| Paper Format | A4 (default), Letter, Legal, A3, A5 |
| Landscape | true / false |
| Scale | 0.1 to 2 |
| Margin | A CSS length on all sides, such as `18mm`. Units: mm, cm, in, px, pt |
| Print Background | true (default) / false |
| Header Text | Text at the top of every page |
| Footer Text | Text at the foot of every page |
| Page Numbers | true / false |

The node is also usable as a tool by the n8n AI Agent. For agents, choose **Download URL** so the agent can hand the link to a person.

## Credentials

You need a MintPDF API key.

1. Get a free key (100 renders a month, email only, no card). Use the form at [mintpdf.dev](https://mintpdf.dev/#keys), or run:

   ```bash
   curl -X POST https://mintpdf.dev/v1/keys \
     -H "Content-Type: application/json" \
     -d '{"email":"you@example.com"}'
   ```

   The response contains `"key": "pm_..."`.

2. In n8n, create a **MintPDF API** credential and paste the key into **API Key**. Leave **Base URL** as `https://mintpdf.dev`. Change it only if you run your own MintPDF server (MintPDF is MIT licensed and self-hostable).

The key is sent as `Authorization: Bearer <key>`.

About the credential test: **Test** calls `GET /v1/me`, which is free and does not spend a render. It fails if the key is wrong.

## Example

Turn a Markdown report into a PDF and send it by email:

1. **Manual Trigger** (or any trigger).
2. **MintPDF**, operation **Markdown to PDF**:
   - Markdown:
     ```
     # Weekly report

     | Metric | Value |
     |---|---:|
     | Orders | {{ $json.orders }} |
     | Revenue | ${{ $json.revenue }} |
     ```
   - Return As: **Binary File**, field `data`, File Name `report.pdf`
   - Options: Paper Format **A4**, Page Numbers **on**, Footer Text `Confidential`
3. **Gmail** (or **Send Email**), with attachment field `data`.

To store the PDF somewhere else, connect the binary output to Google Drive, S3, Dropbox or any node that accepts a file.

## Pricing

| Plan | Renders | Price |
|---|---|---|
| Anonymous | 3 a day | free, no key |
| Free key | 100 a month | free, email only |
| Solo | 3,000 a month | $19/month |
| Team | 12,000 a month | $49/month |
| Scale | 50,000 a month | $129/month |

The API key is the account. To upgrade, keep the same key and choose a plan at [mintpdf.dev/#pricing](https://mintpdf.dev/#pricing). When you reach a limit, the node error includes the exact upgrade step.

## Compatibility

Built with `@n8n/node-cli` 0.50 and tested on n8n 2.41.

## Resources

- [MintPDF docs and API reference](https://mintpdf.dev)
- [MintPDF guides](https://mintpdf.dev/guides)
- [OpenAPI spec](https://mintpdf.dev/openapi.json)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)

## License

[MIT](LICENSE)
