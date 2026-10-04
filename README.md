# QuizGen AI
QuizGen AI is an intelligent study quiz generator that uses Generative AI to convert study material into customized quizzes.

## Overview
QuizGen AI helps students turn their study material into interactive quizzes. Students can enter notes or upload PDF, DOCX, TXT, PNG, JPG, or JPEG files and generate AI-powered questions with answers and explanations.

## Features
- AI-generated quizzes using Google Gemini
- Paste study notes directly
- Upload PDF, DOCX, and TXT documents
- Generate quizzes from images and handwritten notes
- Select number of questions
- Select difficulty level
- Select question type
- Automatic quiz scoring
- Correct and wrong answer highlighting
- Answers with explanations
- Quiz History
- View previous quiz details
- Performance Dashboard
- Daily Challenge
- Custom Daily Challenge topics
- Daily Challenge difficulty selection
- Daily Challenge question count selection
- Daily Challenge question type selection

## Technologies Used
### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Python
- Flask

### Generative AI
- Google Gemini API
- Google GenAI SDK

### Document Processing
- PyPDF
- python-docx

### Data Storage
- Browser LocalStorage for quiz history and performance data

## How It Works
```text
Study Material
      ↓
Text / PDF / DOCX / TXT / Image
      ↓
Flask Backend
      ↓
Google Gemini AI
      ↓
Quiz Generation
      ↓
Questions + Answers + Explanations
      ↓
Student Attempts Quiz
      ↓
Automatic Score
      ↓
History + Dashboard
