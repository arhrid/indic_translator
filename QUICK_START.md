# Quick Start Guide - Indic Language Translator

## 30-Second Setup

```bash
# 1. Install dependencies
pnpm install && pip install -r requirements-ml.txt

# 2. Download model (one-time, ~5 minutes)
./scripts/download-model.sh

# 3. Start dev server
pnpm dev

# 4. Test translation
curl -X POST http://localhost:3000/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello","sourceLang":"en","targetLang":"hi"}'
```

## Common Tasks

### Translate Text via API

```bash
curl -X POST http://localhost:3000/api/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, how are you?",
    "sourceLang": "en",
    "targetLang": "hi"
  }'
```

### Get Supported Languages

```bash
curl http://localhost:3000/api/translate
```

### Use in TypeScript

```typescript
import { translationService } from '@/lib/translation/translator';

const result = await translationService.translate({
  text: "Hello",
  sourceLang: "en",
  targetLang: "hi"
});

console.log(result.translatedText); // नमस्ते
```

### Use in Python

```python
from lib.translation.inference import get_inference

inference = get_inference()
inference.load_model()

result = inference.translate("Hello", "en", "hi")
print(result['translated_text'])  # नमस्ते
```

## Language Codes

**Quick Reference:**
- `en` - English
- `hi` - Hindi
- `ta` - Tamil
- `te` - Telugu
- `kn` - Kannada
- `ml` - Malayalam
- `mr` - Marathi
- `gu` - Gujarati
- `bn` - Bengali
- `pa` - Punjabi

[See MODELS.md for complete list]

## File Locations

| File | Purpose |
|------|---------|
| `lib/translation/translator.ts` | TypeScript service |
| `app/api/translate/route.ts` | API endpoint |
| `lib/translation/inference.py` | Python inference |
| `models/translation/IndicTrans2/` | Model files |
| `.env.local` | Environment config |

## Troubleshooting

**Server won't start:**
```bash
# Check if port 3000 is in use
lsof -i :3000
# Kill process if needed
kill -9 <PID>
```

**Model not found:**
```bash
# Download model
./scripts/download-model.sh

# Verify files exist
ls -la models/translation/IndicTrans2/
```

**Translation fails:**
```bash
# Check language codes are valid
# Check text is not empty
# Check text is under 500 words
```

## Performance Tips

1. **Model loads once** - First translation takes ~2-3s, subsequent are instant
2. **Batch processing** - Translate multiple texts in one request
3. **Caching** - Cache frequent translations (future feature)

## Documentation

- **Setup:** `README_SETUP.md`
- **Models:** `MODELS.md`
- **Phase 3:** `PHASE3.md`
- **Validation:** `VALIDATION_CHECKLIST.md`

## Support

1. Check troubleshooting section above
2. Review relevant documentation
3. Check server logs: `tail -f .next/server.log`
4. Test Python directly: `python3 lib/translation/inference.py`

---

**Status:** Ready to use ✓
**Last Updated:** October 16, 2024
