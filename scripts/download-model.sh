#!/bin/bash

# Download and setup IndicTrans2 model for Indic language translation
# This script is idempotent and safe to run multiple times

set -e

# Configuration
MODEL_NAME="IndicTrans2"
MODEL_REPO="ai4bharat/indictrans2-indic-en-1B"
MODEL_DIR="models/translation"
MODEL_PATH="${MODEL_DIR}/IndicTrans2"
HF_MODEL_ID="ai4bharat/indictrans2-indic-en-1B"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Python is installed
check_python() {
    if ! command -v python3 &> /dev/null; then
        log_error "Python 3 is not installed. Please install Python 3.8 or higher."
        exit 1
    fi
    log_info "Python 3 found: $(python3 --version)"
}

# Check if required Python packages are installed
check_dependencies() {
    log_info "Checking Python dependencies..."
    python3 -c "import huggingface_hub" 2>/dev/null || {
        log_warn "huggingface_hub not found. Installing..."
        pip3 install huggingface-hub transformers torch
    }
}

# Create model directory if it doesn't exist
create_model_dir() {
    if [ ! -d "${MODEL_PATH}" ]; then
        log_info "Creating model directory: ${MODEL_PATH}"
        mkdir -p "${MODEL_PATH}"
    else
        log_info "Model directory already exists: ${MODEL_PATH}"
    fi
}

# Download model from Hugging Face
download_model() {
    log_info "Downloading ${MODEL_NAME} model from Hugging Face..."
    
    # Check if model is already downloaded
    if [ -f "${MODEL_PATH}/config.json" ] && [ -f "${MODEL_PATH}/pytorch_model.bin" ]; then
        log_warn "Model files already exist. Skipping download."
        return 0
    fi
    
    # Download using huggingface_hub
    python3 << 'PYTHON_SCRIPT'
from huggingface_hub import snapshot_download
import os

model_id = "ai4bharat/indictrans2-indic-en-1B"
model_path = "models/translation/IndicTrans2"

try:
    print(f"Downloading {model_id}...")
    snapshot_download(
        repo_id=model_id,
        local_dir=model_path,
        repo_type="model",
        resume_download=True,
        allow_patterns=["*.json", "*.bin", "*.safetensors", "*.model", "*.txt", "*.py"],
    )
    print(f"✓ Model downloaded successfully to {model_path}")
except Exception as e:
    print(f"✗ Error downloading model: {e}")
    exit(1)
PYTHON_SCRIPT
}

# Verify model integrity
verify_model() {
    log_info "Verifying model files..."
    
    required_files=("config.json" "pytorch_model.bin")
    missing_files=()
    
    for file in "${required_files[@]}"; do
        if [ ! -f "${MODEL_PATH}/${file}" ]; then
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -gt 0 ]; then
        log_error "Missing required files: ${missing_files[*]}"
        return 1
    fi
    
    log_info "✓ All required model files present"
}

# Print model information
print_model_info() {
    log_info "Model Information:"
    log_info "  Name: ${MODEL_NAME}"
    log_info "  Repository: ${MODEL_REPO}"
    log_info "  Location: ${MODEL_PATH}"
    
    if [ -d "${MODEL_PATH}" ]; then
        local size=$(du -sh "${MODEL_PATH}" | cut -f1)
        log_info "  Size: ${size}"
        
        log_info "  Files:"
        find "${MODEL_PATH}" -maxdepth 1 -type f | while read file; do
            local filename=$(basename "$file")
            local filesize=$(du -h "$file" | cut -f1)
            echo "    - ${filename} (${filesize})"
        done
    fi
}

# Main execution
main() {
    echo "=========================================="
    echo "IndicTrans2 Model Download Script"
    echo "=========================================="
    echo ""
    
    check_python
    check_dependencies
    create_model_dir
    download_model
    
    if verify_model; then
        echo ""
        print_model_info
        echo ""
        log_info "✓ Model setup completed successfully!"
        log_info "You can now use the model for Indic language translation."
        echo ""
        log_info "Usage example:"
        echo "  from transformers import AutoTokenizer, AutoModelForSeq2SeqLM"
        echo "  tokenizer = AutoTokenizer.from_pretrained('models/translation/IndicTrans2')"
        echo "  model = AutoModelForSeq2SeqLM.from_pretrained('models/translation/IndicTrans2')"
        return 0
    else
        log_error "Model verification failed. Please check the download."
        return 1
    fi
}

# Run main function
main
exit $?
