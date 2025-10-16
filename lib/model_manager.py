"""
Model Manager for IndicTrans2 Translation Model
Handles model loading, caching, and inference
"""

import os
import json
from pathlib import Path
from typing import Optional, Dict, List
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ModelManager:
    """Manages IndicTrans2 model lifecycle and inference"""
    
    # Supported Indic languages (8th Schedule of Indian Constitution)
    SUPPORTED_LANGUAGES = {
        'hi': 'Hindi',
        'ta': 'Tamil',
        'te': 'Telugu',
        'kn': 'Kannada',
        'ml': 'Malayalam',
        'mr': 'Marathi',
        'gu': 'Gujarati',
        'bn': 'Bengali',
        'pa': 'Punjabi',
        'or': 'Odia',
        'as': 'Assamese',
        'ur': 'Urdu',
        'sa': 'Sanskrit',
        'kok': 'Konkani',
        'mni': 'Manipuri',
        'mai': 'Maithili',
        'sd': 'Sindhi',
        'ks': 'Kashmiri',
        'dg': 'Dogri',
        'bodo': 'Bodo',
        'sat': 'Santali',
        'en': 'English',
    }
    
    def __init__(self, model_dir: str = "models/translation/IndicTrans2"):
        """
        Initialize ModelManager
        
        Args:
            model_dir: Path to the model directory
        """
        self.model_dir = Path(model_dir)
        self.model = None
        self.tokenizer = None
        self._check_model_exists()
    
    def _check_model_exists(self) -> bool:
        """Check if model files exist locally"""
        required_files = ['config.json', 'pytorch_model.bin']
        
        if not self.model_dir.exists():
            logger.warning(f"Model directory not found: {self.model_dir}")
            return False
        
        for file in required_files:
            if not (self.model_dir / file).exists():
                logger.warning(f"Missing model file: {file}")
                return False
        
        logger.info(f"✓ Model files found in {self.model_dir}")
        return True
    
    def load_model(self) -> bool:
        """
        Load the IndicTrans2 model and tokenizer
        
        Returns:
            bool: True if model loaded successfully, False otherwise
        """
        try:
            from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
            
            logger.info(f"Loading model from {self.model_dir}...")
            
            self.tokenizer = AutoTokenizer.from_pretrained(
                str(self.model_dir),
                trust_remote_code=True
            )
            
            self.model = AutoModelForSeq2SeqLM.from_pretrained(
                str(self.model_dir),
                trust_remote_code=True,
                device_map="cpu"  # Force CPU for M3 MacBook compatibility
            )
            
            logger.info("✓ Model loaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            return False
    
    def translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        max_length: int = 256
    ) -> Optional[str]:
        """
        Translate text from source to target language
        
        Args:
            text: Text to translate
            source_lang: Source language code (e.g., 'en', 'hi')
            target_lang: Target language code
            max_length: Maximum length of generated translation
        
        Returns:
            Translated text or None if translation fails
        """
        if not self.model or not self.tokenizer:
            logger.error("Model not loaded. Call load_model() first.")
            return None
        
        if source_lang not in self.SUPPORTED_LANGUAGES:
            logger.error(f"Unsupported source language: {source_lang}")
            return None
        
        if target_lang not in self.SUPPORTED_LANGUAGES:
            logger.error(f"Unsupported target language: {target_lang}")
            return None
        
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
            
            # Generate translation
            outputs = self.model.generate(
                **inputs,
                max_length=max_length,
                num_beams=4,
                early_stopping=True
            )
            
            # Decode
            translated = self.tokenizer.decode(
                outputs[0],
                skip_special_tokens=True
            )
            
            return translated
            
        except Exception as e:
            logger.error(f"Translation failed: {e}")
            return None
    
    def batch_translate(
        self,
        texts: List[str],
        source_lang: str,
        target_lang: str
    ) -> List[Optional[str]]:
        """
        Translate multiple texts
        
        Args:
            texts: List of texts to translate
            source_lang: Source language code
            target_lang: Target language code
        
        Returns:
            List of translated texts
        """
        return [
            self.translate(text, source_lang, target_lang)
            for text in texts
        ]
    
    def get_supported_languages(self) -> Dict[str, str]:
        """Get dictionary of supported languages"""
        return self.SUPPORTED_LANGUAGES.copy()
    
    def get_model_info(self) -> Dict:
        """Get information about the loaded model"""
        if not self.model_dir.exists():
            return {"status": "Model not found"}
        
        info = {
            "model_dir": str(self.model_dir),
            "model_loaded": self.model is not None,
            "supported_languages": len(self.SUPPORTED_LANGUAGES),
            "languages": list(self.SUPPORTED_LANGUAGES.keys()),
        }
        
        # Add file size information
        try:
            total_size = sum(
                f.stat().st_size
                for f in self.model_dir.rglob('*')
                if f.is_file()
            )
            info["total_size_mb"] = round(total_size / (1024 * 1024), 2)
        except Exception as e:
            logger.warning(f"Could not calculate model size: {e}")
        
        return info


# Singleton instance
_model_manager: Optional[ModelManager] = None


def get_model_manager() -> ModelManager:
    """Get or create the global ModelManager instance"""
    global _model_manager
    if _model_manager is None:
        _model_manager = ModelManager()
    return _model_manager


def initialize_model() -> bool:
    """Initialize and load the model"""
    manager = get_model_manager()
    return manager.load_model()
