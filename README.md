# GDSC Project Description

This repository contains a full-stack application for summarizing articles using advanced NLP and LLM models. It includes a Python backend, a React frontend, and a Chrome extension for easy access.

## Features
- **Article Summarization:** Uses spaCy and a local Llama-based LLM to generate concise summaries.
- **Key Sentence Extraction:** Identifies and prioritizes the most important sentences in the input text.
- **Frontend:** React-based UI for user interaction.
- **Chrome Extension:** Quickly summarize content from any webpage.

## Project Structure
```
backend/        # Python FastAPI backend for summarization
frontend/       # React frontend application
extension/      # Chrome extension for quick access
```

## Backend Setup
1. Install Python dependencies:
   ```sh
   pip install -r requirements.txt
   ```
2. Make sure you have the following packages:
   - huggingface_hub
   - spacy
   - llama_cpp
   - (and others in requirements.txt)
3. Download the spaCy English model:
   ```sh
   python -m spacy download en_core_web_sm
   ```
4. Run the backend server:
   ```sh
   python backend/main.py
   ```

## Frontend Setup
1. Navigate to the `frontend` folder:
   ```sh
   cd frontend
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the development server:
   ```sh
   npm start
   ```

## Chrome Extension
- The `extension` folder contains the Chrome extension source code.
- Load it as an unpacked extension in Chrome for testing.

## Usage
- Enter or paste article text in the frontend to receive a summary.
- Use the Chrome extension to summarize content directly from web pages.

## Requirements
- Python 3.8+
- Node.js 14+
- Chrome browser (for extension)

## License
This project is for educational purposes.
