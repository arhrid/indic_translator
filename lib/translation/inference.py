"""
IndicTrans2 Model Inference Wrapper
Handles model loading, caching, and translation inference
"""

import os
import time
import logging
from typing import Optional, Dict, Tuple
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try to import transformers, handle gracefully if not available
try:
    from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    logger.warning("transformers library not available. Install with: pip install -r requirements-ml.txt")

try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    logger.warning("torch library not available. Install with: pip install -r requirements-ml.txt")


class TranslationInference:
    """Handles IndicTrans2 model inference with caching and error handling"""

    # Supported language pairs
    SUPPORTED_LANGUAGES = {
        'hi': 'Hindi', 'ta': 'Tamil', 'te': 'Telugu', 'kn': 'Kannada',
        'ml': 'Malayalam', 'mr': 'Marathi', 'gu': 'Gujarati', 'bn': 'Bengali',
        'pa': 'Punjabi', 'or': 'Odia', 'as': 'Assamese', 'ur': 'Urdu',
        'sa': 'Sanskrit', 'kok': 'Konkani', 'mni': 'Manipuri', 'mai': 'Maithili',
        'sd': 'Sindhi', 'ks': 'Kashmiri', 'dg': 'Dogri', 'bodo': 'Bodo',
        'sat': 'Santali', 'en': 'English'
    }

    def __init__(self, model_dir: str = "models/translation/IndicTrans2"):
        """
        Initialize the inference wrapper

        Args:
            model_dir: Path to the downloaded IndicTrans2 model
        """
        self.model_dir = Path(model_dir)
        self.model = None
        self.tokenizer = None
        self.device = "cpu"  # Force CPU for M3 MacBook compatibility
        self._model_loaded = False
        self._load_start_time = None

    def is_available(self) -> bool:
        """Check if all dependencies are available"""
        return TRANSFORMERS_AVAILABLE and TORCH_AVAILABLE

    def load_model(self) -> bool:
        """
        Load the IndicTrans2 model and tokenizer

        Returns:
            bool: True if successful, False otherwise
        """
        if self._model_loaded:
            logger.info("Model already loaded")
            return True

        if not self.is_available():
            logger.error("Required dependencies not available")
            return False

        if not self.model_dir.exists():
            logger.error(f"Model directory not found: {self.model_dir}")
            return False

        try:
            self._load_start_time = time.time()
            logger.info(f"Loading IndicTrans2 model from {self.model_dir}...")

            # Load tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(
                str(self.model_dir),
                trust_remote_code=True,
                local_files_only=True
            )
            logger.info("✓ Tokenizer loaded")

            # Load model
            self.model = AutoModelForSeq2SeqLM.from_pretrained(
                str(self.model_dir),
                trust_remote_code=True,
                local_files_only=True,
                device_map=self.device,
                torch_dtype=torch.float32 if TORCH_AVAILABLE else None
            )

            # Set model to evaluation mode
            if self.model:
                self.model.eval()

            load_time = time.time() - self._load_start_time
            logger.info(f"✓ Model loaded successfully in {load_time:.2f}s")
            self._model_loaded = True
            return True

        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            self._model_loaded = False
            return False

    def validate_input(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        max_words: int = 500
    ) -> Tuple[bool, Optional[str]]:
        """
        Validate translation input

        Args:
            text: Text to translate
            source_lang: Source language code
            target_lang: Target language code
            max_words: Maximum allowed words

        Returns:
            Tuple of (is_valid, error_message)
        """
        # Check text
        if not text or not text.strip():
            return False, "Text cannot be empty"

        word_count = len(text.strip().split())
        if word_count > max_words:
            return False, f"Text exceeds maximum of {max_words} words (got {word_count})"

        # Check languages
        if source_lang not in self.SUPPORTED_LANGUAGES:
            return False, f"Unsupported source language: {source_lang}"

        if target_lang not in self.SUPPORTED_LANGUAGES:
            return False, f"Unsupported target language: {target_lang}"

        if source_lang == target_lang:
            return False, "Source and target languages must be different"

        return True, None

    def translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        max_length: int = 256,
        num_beams: int = 4
    ) -> Dict:
        """
        Translate text from source to target language

        Args:
            text: Text to translate
            source_lang: Source language code
            target_lang: Target language code
            max_length: Maximum length of generated translation
            num_beams: Number of beams for beam search

        Returns:
            Dictionary with translation result or error
        """
        start_time = time.time()

        # Validate input
        is_valid, error_msg = self.validate_input(text, source_lang, target_lang)
        if not is_valid:
            return {
                "success": False,
                "error": error_msg,
                "duration_ms": int((time.time() - start_time) * 1000)
            }

        # Check if model is loaded
        if not self._model_loaded:
            return {
                "success": False,
                "error": "Model not loaded. Call load_model() first.",
                "duration_ms": int((time.time() - start_time) * 1000)
            }

        try:
            # Prepare input with language tags
            input_text = f"{source_lang}: {text}"

            # Tokenize
            inputs = self.tokenizer(
                input_text,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=512
            )

            # Move to device if using GPU
            if TORCH_AVAILABLE and self.device != "cpu":
                inputs = {k: v.to(self.device) for k, v in inputs.items()}

            # Generate translation
            with torch.no_grad() if TORCH_AVAILABLE else None:
                outputs = self.model.generate(
                    **inputs,
                    max_length=max_length,
                    num_beams=num_beams,
                    early_stopping=True
                )

            # Decode
            translated_text = self.tokenizer.decode(
                outputs[0],
                skip_special_tokens=True
            )

            duration_ms = int((time.time() - start_time) * 1000)

            logger.info(
                f"Translation completed: {source_lang} -> {target_lang} "
                f"({len(text.split())} words, {duration_ms}ms)"
            )

            return {
                "success": True,
                "translated_text": translated_text,
                "source_lang": source_lang,
                "target_lang": target_lang,
                "duration_ms": duration_ms,
                "word_count": len(text.split()),
                "inference_speed": f"{len(text.split()) / (duration_ms / 1000):.1f} words/sec"
            }

        except Exception as e:
            logger.error(f"Translation error: {e}")
            return {
                "success": False,
                "error": str(e),
                "duration_ms": int((time.time() - start_time) * 1000)
            }

    def batch_translate(
        self,
        texts: list,
        source_lang: str,
        target_lang: str
    ) -> list:
        """
        Translate multiple texts

        Args:
            texts: List of texts to translate
            source_lang: Source language code
            target_lang: Target language code

        Returns:
            List of translation results
        """
        results = []
        for text in texts:
            result = self.translate(text, source_lang, target_lang)
            results.append(result)
        return results

    def get_supported_languages(self) -> Dict[str, str]:
        """Get dictionary of supported languages"""
        return self.SUPPORTED_LANGUAGES.copy()

    def get_model_info(self) -> Dict:
        """Get information about the loaded model"""
        info = {
            "model_dir": str(self.model_dir),
            "model_loaded": self._model_loaded,
            "device": self.device,
            "supported_languages": len(self.SUPPORTED_LANGUAGES),
            "languages": list(self.SUPPORTED_LANGUAGES.keys()),
        }

        if self.model_dir.exists():
            try:
                total_size = sum(
                    f.stat().st_size
                    for f in self.model_dir.rglob('*')
                    if f.is_file()
                )
                info["total_size_gb"] = round(total_size / (1024 ** 3), 2)
            except Exception as e:
                logger.warning(f"Could not calculate model size: {e}")

        return info


# Global inference instance
_inference_instance: Optional[TranslationInference] = None


def get_inference() -> TranslationInference:
    """Get or create the global inference instance"""
    global _inference_instance
    if _inference_instance is None:
        _inference_instance = TranslationInference()
    return _inference_instance


def initialize_model() -> bool:
    """Initialize and load the model"""
    inference = get_inference()
    return inference.load_model()


if __name__ == "__main__":
    # Test script
    print("Testing IndicTrans2 Inference...")
    print("-" * 50)

    inference = get_inference()

    # Check dependencies
    if not inference.is_available():
        print("❌ Required dependencies not available")
        print("Install with: pip install -r requirements-ml.txt")
        exit(1)

    # Load model
    print("Loading model...")
    if not inference.load_model():
        print("❌ Failed to load model")
        exit(1)

    print("✓ Model loaded successfully")
    print()

    # Test translation
    test_cases = [
        ("Hello, how are you?", "en", "hi"),
        ("Good morning", "en", "ta"),
        ("नमस्ते", "hi", "en"),
    ]

    for text, src, tgt in test_cases:
        print(f"Translating: '{text}' ({src} -> {tgt})")
        result = inference.translate(text, src, tgt)

        if result["success"]:
            print(f"  ✓ {result['translated_text']}")
            print(f"    Duration: {result['duration_ms']}ms")
        else:
            print(f"  ❌ {result['error']}")
        print()

    # Print model info
    print("Model Information:")
    info = inference.get_model_info()
    for key, value in info.items():
        print(f"  {key}: {value}")
