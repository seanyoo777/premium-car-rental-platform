# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

This is a single static HTML landing page (`index.html`) for a Korean premium car rental platform. There is no build system, no package manager, no framework, and no external dependencies.

### Running the application

Serve the file with any static HTTP server:

```bash
python3 -m http.server 8080 --directory /workspace
```

Then open `http://localhost:8080/index.html` in a browser.

### Testing

There are no automated tests, linters, or build steps. Manual verification:

1. Page renders correctly in browser (dark theme, responsive layout).
2. The payment calculator (JavaScript) updates deposit/monthly/total values when the car price input changes.
3. The consultation form fields are visible (form is non-functional/demo only).

### Key notes

- The entire application is self-contained in `index.html` (inline CSS + inline JS).
- No `node_modules`, `package.json`, or dependency files exist.
- The calculator uses 7.5% APR over 36 months with a ₩50,000/month management fee.
