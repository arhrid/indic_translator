"""
API Wrapper for Translation Service
Bridges TypeScript API endpoints with Python inference engine
"""

import json
import logging
from typing import Dict, Any
from inference import get_inference, initialize_model

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TranslationAPIWrapper:
    """Wrapper for handling API requests to the translation service"""

    def __init__(self):
        """Initialize the API wrapper"""
        self.inference = get_inference()
        self._initialized = False

    def initialize(self) -> bool:
        """Initialize the inference engine"""
        if self._initialized:
            return True

        logger.info("Initializing translation service...")
        if self.inference.load_model():
            self._initialized = True
            logger.info("✓ Translation service initialized")
            return True
        else:
            logger.error("Failed to initialize translation service")
            return False

    def handle_translate_request(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle a translation request

        Args:
            request_data: Dictionary with keys: text, source_lang, target_lang

        Returns:
            Response dictionary
        """
        try:
            # Extract parameters
            text = request_data.get('text', '').strip()
            source_lang = request_data.get('source_lang', '').lower()
            target_lang = request_data.get('target_lang', '').lower()

            # Validate parameters
            if not text:
                return {
                    "success": False,
                    "error": "Text parameter is required and cannot be empty"
                }

            if not source_lang or not target_lang:
                return {
                    "success": False,
                    "error": "source_lang and target_lang parameters are required"
                }

            # Ensure model is initialized
            if not self._initialized:
                if not self.initialize():
                    return {
                        "success": False,
                        "error": "Failed to initialize translation model"
                    }

            # Perform translation
            result = self.inference.translate(text, source_lang, target_lang)

            return result

        except Exception as e:
            logger.error(f"Error handling translation request: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def handle_languages_request(self) -> Dict[str, Any]:
        """
        Handle a request for supported languages

        Returns:
            Response dictionary with language list
        """
        try:
            languages = self.inference.get_supported_languages()
            return {
                "success": True,
                "languages": languages,
                "count": len(languages)
            }
        except Exception as e:
            logger.error(f"Error getting languages: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def handle_status_request(self) -> Dict[str, Any]:
        """
        Handle a status request

        Returns:
            Response dictionary with service status
        """
        try:
            info = self.inference.get_model_info()
            return {
                "success": True,
                "status": "ready" if self._initialized else "not_initialized",
                "model_info": info
            }
        except Exception as e:
            logger.error(f"Error getting status: {e}")
            return {
                "success": False,
                "error": str(e)
            }


# Global API wrapper instance
_api_wrapper: TranslationAPIWrapper | None = None


def get_api_wrapper() -> TranslationAPIWrapper:
    """Get or create the global API wrapper instance"""
    global _api_wrapper
    if _api_wrapper is None:
        _api_wrapper = TranslationAPIWrapper()
    return _api_wrapper


# Flask/FastAPI integration example
def create_flask_app():
    """Create a Flask app for the translation API"""
    try:
        from flask import Flask, request, jsonify
    except ImportError:
        logger.error("Flask not installed. Install with: pip install flask")
        return None

    app = Flask(__name__)
    wrapper = get_api_wrapper()

    @app.route('/api/translate', methods=['POST'])
    def translate():
        """Translation endpoint"""
        try:
            data = request.get_json()
            result = wrapper.handle_translate_request(data)
            status_code = 200 if result.get('success') else 400
            return jsonify(result), status_code
        except Exception as e:
            logger.error(f"Error in /api/translate: {e}")
            return jsonify({"success": False, "error": str(e)}), 500

    @app.route('/api/languages', methods=['GET'])
    def languages():
        """Languages endpoint"""
        try:
            result = wrapper.handle_languages_request()
            return jsonify(result), 200
        except Exception as e:
            logger.error(f"Error in /api/languages: {e}")
            return jsonify({"success": False, "error": str(e)}), 500

    @app.route('/api/status', methods=['GET'])
    def status():
        """Status endpoint"""
        try:
            result = wrapper.handle_status_request()
            return jsonify(result), 200
        except Exception as e:
            logger.error(f"Error in /api/status: {e}")
            return jsonify({"success": False, "error": str(e)}), 500

    @app.before_request
    def initialize():
        """Initialize on first request"""
        if not wrapper._initialized:
            wrapper.initialize()

    return app


if __name__ == "__main__":
    # Test the API wrapper
    print("Testing Translation API Wrapper...")
    print("-" * 50)

    wrapper = get_api_wrapper()

    # Initialize
    if not wrapper.initialize():
        print("Failed to initialize")
        exit(1)

    # Test translation
    print("\n1. Testing translation request:")
    result = wrapper.handle_translate_request({
        "text": "Hello, how are you?",
        "source_lang": "en",
        "target_lang": "hi"
    })
    print(json.dumps(result, indent=2, ensure_ascii=False))

    # Test languages
    print("\n2. Testing languages request:")
    result = wrapper.handle_languages_request()
    print(f"Supported languages: {result.get('count')}")
    print(f"Languages: {list(result.get('languages', {}).keys())}")

    # Test status
    print("\n3. Testing status request:")
    result = wrapper.handle_status_request()
    print(json.dumps(result, indent=2, ensure_ascii=False))
