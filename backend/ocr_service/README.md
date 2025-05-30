# OCR Service

This service provides OCR (Optical Character Recognition) capabilities for receipt scanning and expense tracking.

## Features

- Fast and accurate receipt text extraction
- Support for multiple image formats (JPG, PNG, BMP, TIFF)
- Automatic merchant name detection
- Date extraction
- Amount detection with currency support
- Category classification
- Batch processing capabilities

## Setup

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Run the service:

```bash
python app.py
```

The service will be available at `http://localhost:5000`

## API Endpoints

### POST /upload

Upload and process a receipt image.

**Request:**

- Method: POST
- Content-Type: multipart/form-data
- Body: file (image)

**Response:**

```json
{
  "merchant": "Store Name",
  "date": "2024-04-06",
  "amount": "₹1,234.56",
  "category": "Groceries"
}
```

## Directory Structure

```
.
├── app.py              # Main Flask application
├── fast_ocr.py        # OCR implementation
├── expense_ocr.py     # Expense-specific OCR
├── batch_process.py   # Batch processing utility
├── requirements.txt   # Python dependencies
├── static/           # Static files
├── templates/        # HTML templates
└── uploads/         # Temporary upload directory
```

## Environment Variables

- `FLASK_DEBUG`: Enable debug mode (default: False)
- `FLASK_HOST`: Host to bind to (default: 127.0.0.1)
- `FLASK_PORT`: Port to listen on (default: 5000)

## Testing

Run the test suite:

```bash
python -m pytest test_*.py
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Command Line Usage

You can also use the OCR functionality from the command line:

```python
from fast_ocr import FastOCR

# Initialize OCR (use GPU if available)
ocr = FastOCR(use_gpu=True)

# Process an image
result = ocr.process_image("path/to/receipt.jpg")

# Print results
print(f"Merchant: {result['merchant']}")
print(f"Date: {result['date']}")
print(f"Amount: {result['amount']}")
print(f"Category: {result['category']}")

# Save to JSON
ocr.save_to_json(result, "expense_data.json")
```

## Performance Optimization

The application is optimized for speed with the following features:

- Precompiled regex patterns
- Efficient image preprocessing
- Batch processing for OCR
- Optimized text block organization
- Reduced memory allocations

## Requirements

- Python 3.8+
- Flask
- EasyOCR
- OpenCV
- NumPy
- Python-dateutil
- Pillow

## License

MIT #   C u s t o m _ D a t a 
 
 
