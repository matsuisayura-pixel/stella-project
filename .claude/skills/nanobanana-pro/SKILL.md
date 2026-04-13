---
name: gemini-image-generator
description: AI image generation via Gemini
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Gemini Image Generator

Gemini NanoBananaを使った汎用AI画像生成スキル。

## When to Use This Skill

Trigger when user:
- Asks to generate/create images with AI
- Mentions "Gemini image", "generate picture", "create artwork"
- Requests visual content from text descriptions
- Wants to produce illustrations or graphics
- **Wants to create images matching a reference image's style** (NEW!)

**For specific use cases, use specialized skills:**
- **LP/セールスレター画像** → `gemini-lp-generator`
- **ウェビナースライド** → `gemini-slide-generator`

## Quick Start

```bash
cd /path/to/gemini-image-generator

# 1. Check authentication
python scripts/run.py auth_manager.py status

# 2. Authenticate (if needed)
python scripts/run.py auth_manager.py setup

# 3. Generate image (basic)
python scripts/run.py image_generator.py \
  --prompt "sunset over mountains, watercolor style" \
  --output output/my_image.png

# 4. Generate with reference image (NEW!)
python scripts/run.py image_generator.py \
  --prompt "犬を描いて" \
  --reference-image "/path/to/reference.png" \
  --output output/styled_dog.png
```

## How It Works

### Basic Mode (テキストのみ)
1. Navigate to `gemini.google.com`
2. Click "ツール" (Tools) button
3. Select "画像を作成" (Create Image) - Activates NanoBanana
4. Enter prompt and generate
5. Download generated image

### Reference Image Mode (参考画像あり) - NEW!
1. Upload reference image to Gemini
2. AI analyzes visual elements (style, colors, lighting, etc.)
3. Extract analysis as YAML format
4. Generate optimized meta-prompt
5. Create new image with matching style

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│  📷 Reference  │ →   │  📋 YAML       │ →   │  📝 Optimized  │
│     Image      │     │    Analysis    │     │     Prompt     │
└────────────────┘     └────────────────┘     └────────────────┘
                                                      │
                                                      ▼
                                              ┌────────────────┐
                                              │  🖼️ Generated  │
                                              │     Image      │
                                              └────────────────┘
```

## Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `--prompt` | Yes | - | Image generation prompt |
| `--output` | No | `output/generated_image.png` | Output file path |
| `--reference-image` | No | - | Reference image for style extraction |
| `--yaml-output` | No | - | Save YAML analysis to file |
| `--show-browser` | No | False | Show browser for debugging |
| `--timeout` | No | 180 | Max wait time in seconds |

## Prompt Examples

### Basic Examples (テキストのみ)

```bash
# Landscape
python scripts/run.py image_generator.py \
  --prompt "serene sunset over snow-capped mountains, warm orange sky, photorealistic"

# Art style
python scripts/run.py image_generator.py \
  --prompt "watercolor painting of a cat sitting by window, soft colors"

# Product photo
python scripts/run.py image_generator.py \
  --prompt "professional product photography, white background, soft lighting"
```

### Reference Image Examples (参考画像あり) - NEW!

```bash
# Match style of reference image
python scripts/run.py image_generator.py \
  --prompt "犬を描いて" \
  --reference-image "examples/watercolor_cat.png" \
  --output output/watercolor_dog.png

# Save YAML analysis for review
python scripts/run.py image_generator.py \
  --prompt "森の風景" \
  --reference-image "examples/sunset.jpg" \
  --yaml-output output/analysis.yaml \
  --output output/forest.png

# Debug mode with browser visible
python scripts/run.py image_generator.py \
  --prompt "カフェの内装" \
  --reference-image "examples/cozy_room.png" \
  --show-browser \
  --output output/cafe.png
```

### Standalone Tools

```bash
# Extract YAML only (without generating image)
python scripts/run.py prompt_extractor.py \
  --image "examples/reference.png" \
  --output analysis.yaml

# Generate prompt from YAML
python scripts/run.py meta_prompt.py \
  --yaml analysis.yaml \
  --request "猫を描いて"
```

## Authentication

This skill manages browser authentication for all Gemini-based skills:
- `gemini-slide-generator` (shares browser profile)
- `gemini-lp-generator` (shares browser profile)

```bash
# Check status
python scripts/run.py auth_manager.py status

# Setup (opens browser for Google login)
python scripts/run.py auth_manager.py setup

# Clear session
python scripts/run.py auth_manager.py clear
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Not authenticated | Run `auth_manager.py setup` |
| Timeout | Increase with `--timeout 300` |
| UI not found | Use `--show-browser` to debug |
| Generation refused | Modify prompt (avoid restricted content) |

## Data Storage

- `data/browser_profile/` - Browser session (shared with other Gemini skills)
- `data/state.json` - Authentication state
- `output/` - Generated images

## Architecture

```
scripts/
├── config.py           # Centralized settings
├── browser_utils.py    # BrowserFactory and StealthUtils
├── auth_manager.py     # Authentication management
├── image_generator.py  # Image generation (with reference image support)
├── prompt_extractor.py # Extract visual elements as YAML (NEW!)
├── meta_prompt.py      # Generate optimized prompts from YAML (NEW!)
└── run.py              # Wrapper script for venv

docs/
└── UPGRADE_SPEC.md     # Feature specification with diagrams
```

## Notes

- **First generation takes longer** (browser startup)
- **Subsequent generations faster** (session reuse)
- **Authentication persists** ~7 days
- **UI selectors may break** when Gemini updates
