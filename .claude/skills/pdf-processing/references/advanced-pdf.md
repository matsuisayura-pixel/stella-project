# Advanced PDF Processing

## Parallel Processing

The `@sylphx/pdf-reader-mcp` provides 5-10x faster processing:

| Document | Sequential | Parallel | Speedup |
|----------|-----------|----------|---------|
| 10-page | ~2s | ~0.3s | 5-8x |
| 50-page | ~10s | ~1s | 10x |
| 100+ pages | ~20s | ~2s | Linear scaling |

## Y-Coordinate Content Ordering

Content is ordered by Y-coordinate to preserve document layout:

```json
{
  "sources": [{"path": "document.pdf"}],
  "operation": "extract",
  "ordering": "y-coordinate"
}
```

## Batch Processing

### Multiple Files
```json
{
  "sources": [
    {"path": "doc1.pdf"},
    {"path": "doc2.pdf"},
    {"path": "doc3.pdf"}
  ],
  "operation": "extract"
}
```

### Page Ranges
```json
{
  "sources": [
    {"path": "large.pdf", "pages": "1-10"},
    {"path": "large.pdf", "pages": "11-20"}
  ]
}
```

## Error Resilience

Per-page error handling ensures partial results:

```
Page 1: ✓ Extracted
Page 2: ✓ Extracted
Page 3: ✗ Error (encrypted)
Page 4: ✓ Extracted
...
Result: 99/100 pages extracted
```

## Performance Benchmarks

| Operation | Ops/sec | Notes |
|-----------|---------|-------|
| Error handling | 12,933 | Validation |
| Full text | 5,575 | Document analysis |
| Single page | 5,329 | Quick extraction |
| Multiple pages | 5,242 | Batch processing |
| Metadata only | 4,912 | Quick inspection |

## Memory Optimization

For large documents:
1. Process in chunks
2. Stream results to file
3. Use page ranges

```python
# Process large PDF in chunks
from pypdf import PdfReader

reader = PdfReader("large.pdf")
for i in range(0, len(reader.pages), 10):
    chunk = reader.pages[i:i+10]
    # Process chunk
    # Save intermediate results
```

## Image Extraction

```python
from pypdf import PdfReader

reader = PdfReader("document.pdf")
for page in reader.pages:
    for image in page.images:
        with open(f"{image.name}", "wb") as f:
            f.write(image.data)
```

## Encryption/Decryption

### Decrypt PDF
```python
from pypdf import PdfReader, PdfWriter

reader = PdfReader("encrypted.pdf")
if reader.is_encrypted:
    reader.decrypt("password")

writer = PdfWriter()
for page in reader.pages:
    writer.add_page(page)

with open("decrypted.pdf", "wb") as f:
    writer.write(f)
```

### Encrypt PDF
```python
from pypdf import PdfReader, PdfWriter

reader = PdfReader("input.pdf")
writer = PdfWriter()

for page in reader.pages:
    writer.add_page(page)

writer.encrypt("userpassword", "ownerpassword")

with open("encrypted.pdf", "wb") as f:
    writer.write(f)
```
