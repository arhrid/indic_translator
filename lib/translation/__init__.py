"""
Translation module for Indic Language Translator
Provides translation services for 22 Indian languages
"""

__version__ = "1.0.0"
__author__ = "Indic Translator Team"

# Export main components
from .inference import (
    TranslationInference,
    get_inference,
    initialize_model,
)

from .api_wrapper import (
    TranslationAPIWrapper,
    get_api_wrapper,
    create_flask_app,
)

__all__ = [
    "TranslationInference",
    "get_inference",
    "initialize_model",
    "TranslationAPIWrapper",
    "get_api_wrapper",
    "create_flask_app",
]
