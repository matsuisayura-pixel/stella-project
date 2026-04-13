# Apify PDF Actors

## Available Actors

| Actor | Author | Best For | Cost |
|-------|--------|----------|------|
| PDF Text Extractor | jirimoravcik | General extraction | ~$4-8/1000 files |
| PDF Scraper | onidivo | Batch downloading | ~$4-8/1000 files |
| PDF Intelligence | marielise.dev | RAG optimization | Premium |
| OCR Structured Extractor | macheta | Invoices, forms | ~$5/100 pages |

## PDF Text Extractor (Recommended)

```bash
# Install Apify CLI
npm install -g apify-cli

# Run actor
apify call jirimoravcik/pdf-text-extractor \
  -i '{
    "pdfUrls": [
      "https://example.com/doc1.pdf",
      "https://example.com/doc2.pdf"
    ],
    "chunkSize": 1000,
    "chunkOverlap": 200
  }'
```

### Input Schema
```json
{
  "pdfUrls": ["array of PDF URLs"],
  "chunkSize": 1000,
  "chunkOverlap": 200
}
```

### Output Format
```json
{
  "url": "source URL",
  "positionIndex": 0,
  "text": "extracted chunk"
}
```

## PDF Intelligence (Premium)

Best for:
- Table extraction with structure preservation
- RAG-optimized chunking
- Complex document layouts

```bash
apify call marielise.dev/pdf-intelligence \
  -i '{
    "pdfUrl": "https://example.com/complex.pdf",
    "extractTables": true,
    "preserveLayout": true
  }'
```

## OCR Structured Extractor

For scanned documents:

```bash
apify call macheta/ocr-structured-extractor \
  -i '{
    "imageUrl": "https://example.com/scanned.pdf",
    "outputFormat": "json"
  }'
```

## Integration with Taisun

### Using with mega-research skill
```bash
# Combine PDF extraction with research
1. Extract PDF content
2. Pass to mega-research for analysis
3. Generate cited report
```

### Memory Integration
```bash
# Store extracted content in Qdrant
1. Extract PDF
2. Chunk text
3. Use qdrant-memory skill to store
```
