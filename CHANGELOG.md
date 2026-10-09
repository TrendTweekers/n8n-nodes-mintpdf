# Changelog

## 0.1.1

- Failed renders now reach the error output when "On Error" is set to continue using error output.
- Credential test uses GET /v1/me, a real key check that does not spend a render.

## 0.1.0

- First release. MintPDF node with HTML to PDF, Markdown to PDF and URL to PDF.
- Output as n8n binary data or as a one-hour download URL.
- Options: paper format, landscape, scale, margin, print background, header text, footer text, page numbers.
- MintPDF API credential (Bearer key, configurable base URL for self-hosted servers).
