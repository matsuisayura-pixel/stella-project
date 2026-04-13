# TAISUN v2 - L3: Expert Workflows

## Interactive Video Mandatory Workflow

All layers MUST be executed. CSS-only visuals are PROHIBITED.

| Layer | Process | Tool | Status |
|-------|---------|------|--------|
| 1 | Script generation | Claude Opus + taiyo-style-vsl + taiyo-analyzer (80+) | MANDATORY |
| 2a | 4K image generation | flow-image (NanoBanana Pro / Google Imagen 3) | MANDATORY |
| 2b | Image quality check | agentic-vision (Gemini 3 Flash, 7/10+) | MANDATORY |
| 2c | Japanese text verify | japanese-text-verifier (manga-ocr, ratio >= 0.3) | MANDATORY |
| 2d | TTS audio generation | Fish Audio API (voice ID: user must specify) | MANDATORY |
| 2e | Video composition | Remotion (4K + subtitles + Ken Burns + emotion fx) | MANDATORY |
| 3 | Interactive player | HTML/JS branching player | MANDATORY |
| 4a | Deploy | Vercel | MANDATORY |
| 4b | Final QA | Playwright MCP + agentic-vision | MANDATORY |

### Multimedia Pipeline Phases (interactive-video-platform)
```
Phase 2a: IMAGE -> NanoBanana Pro / flow-image
Phase 2b: QA -> agentic-vision quality check
Phase 2c: TEXT_VERIFY -> japanese-text-verifier
Phase 2d: TTS -> Fish Audio (macOS say PROHIBITED)
Phase 2e: COMPOSE -> Remotion
```

### Prohibited Actions
- Generating video with CSS gradients only (no flow-image)
- Selecting Fish Audio voice ID without user confirmation
- Skipping agentic-vision quality check
- Using alternative tools instead of Remotion
- Sending TTS without text_preprocessor.py preprocessing

## TTS Number Preprocessing (Mandatory)

Fish Audio API requires preprocessing via `scripts/text_preprocessor.py`.

| Input | Correct Reading | Wrong Reading |
|-------|----------------|---------------|
| 1000万 | いっせんまん | せんまん |
| 3000万 | さんぜんまん | さんせんまん |
| 8000億 | はっせんおく | はちせんおく |
| 1億 | いちおく | - |
| 1兆 | いっちょう | いちちょう |
| 300万 | さんびゃくまん | さんひゃくまん |
| 600万 | ろっぴゃくまん | ろくひゃくまん |
| 800万 | はっぴゃくまん | はちひゃくまん |

Usage: `JapaneseTextPreprocessor.preprocess()` from `scripts/text_preprocessor.py`
