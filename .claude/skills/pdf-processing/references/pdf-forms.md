# PDF Form Filling Guide

## Overview

PDF forms can be filled programmatically using various tools.

## Using pypdf

### Read Form Fields
```python
from pypdf import PdfReader

reader = PdfReader("form.pdf")
fields = reader.get_form_text_fields()
print(fields)  # {field_name: current_value}
```

### Fill Form
```python
from pypdf import PdfReader, PdfWriter

reader = PdfReader("form.pdf")
writer = PdfWriter()
writer.append(reader)

# Update fields
writer.update_page_form_field_values(
    writer.pages[0],
    {
        "name": "John Doe",
        "email": "john@example.com",
        "date": "2026-02-04"
    }
)

with open("filled_form.pdf", "wb") as f:
    writer.write(f)
```

## Using pdftk

```bash
# List fields
pdftk form.pdf dump_data_fields

# Fill form
pdftk form.pdf fill_form data.fdf output filled.pdf

# Flatten form (make fields non-editable)
pdftk form.pdf fill_form data.fdf output filled.pdf flatten
```

## Creating FDF Data File

```
%FDF-1.2
1 0 obj
<< /FDF
   << /Fields [
        << /T (name) /V (John Doe) >>
        << /T (email) /V (john@example.com) >>
      ]
   >>
>>
endobj
trailer
<< /Root 1 0 R >>
%%EOF
```

## Validation Loop

```markdown
Form Filling Progress:
- [ ] Step 1: Extract form fields
- [ ] Step 2: Validate field names
- [ ] Step 3: Prepare field values
- [ ] Step 4: Fill form
- [ ] Step 5: Verify filled values
- [ ] Step 6: Flatten if needed
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Field not found | Check exact field name (case-sensitive) |
| Value not saved | Flatten form or use different library |
| Font issues | Embed fonts in output |
| Checkbox not checked | Use /Yes or /On as value |

## Japanese Form Handling

```python
from pypdf import PdfReader, PdfWriter
from pypdf.generic import NameObject, TextStringObject

reader = PdfReader("japanese_form.pdf")
writer = PdfWriter()
writer.append(reader)

# Set Japanese text
writer.update_page_form_field_values(
    writer.pages[0],
    {
        "氏名": "田中太郎",
        "住所": "東京都渋谷区"
    }
)
```
