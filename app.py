from flask import Flask, render_template, request, jsonify
from google import genai
from google.genai import types
from pypdf import PdfReader
from docx import Document

app = Flask(__name__)
client = genai.Client()

def extract_text(file):
    filename=file.filename.lower()
    if filename.endswith(".pdf"):
        reader=PdfReader(file)
        text=""
        for page in reader.pages:
            page_text=page.extract_text()
            if page_text:
                text+=page_text+"\n"
        return text
    elif filename.endswith(".docx"):
        document=Document(file)
        text=""
        for paragraph in document.paragraphs:
            text+=paragraph.text+"\n"
        return text
    elif filename.endswith(".txt"):
        return file.read().decode("utf-8")
    return None

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/generate_quiz",methods=["POST"])
def generate_quiz():
    uploaded_file=request.files.get("studyDocument")

    if uploaded_file and uploaded_file.filename:
        filename=uploaded_file.filename.lower()

        if filename.endswith((".png",".jpg",".jpeg")):
            image_data=uploaded_file.read()
            image_part=types.Part.from_bytes(
                data=image_data,
                mime_type=uploaded_file.mimetype
            )
            question_number=request.form.get("questionNumber","5")
            difficulty=request.form.get("difficulty","Easy")
            question_type=request.form.get("questionType","MCQ")

            image_prompt=f"""
You are an educational quiz generator.

Look carefully at the uploaded study-notes image.

Create a quiz using ONLY the information visible in the image.

Requirements:

- Generate exactly {question_number} questions.
- Difficulty: {difficulty}
- Question type: {question_type}
- Include the correct answer.
- Include a short explanation.
- Avoid duplicate questions.
- Do not invent information that is not visible in the image.

Return ONLY valid JSON.

Use exactly this format:

{{
    "questions": [
        {{
            "question": "Question text",
            "options": [
                "Option A",
                "Option B",
                "Option C",
                "Option D"
            ],
            "answer": "Correct option",
            "explanation": "Short explanation"
        }}
    ]
}}
"""

            response=client.models.generate_content(
                model="gemini-3.5-flash-lite",
                contents=[image_part,image_prompt],
                config={"response_mime_type":"application/json"}
            )

            return jsonify({"quiz":response.text})

        else:
            study_material=extract_text(uploaded_file)

            if not study_material:
                return jsonify({"error":"Could not read the uploaded document."}),400
    else:
        study_material=request.form.get("studyMaterial","")

    question_number=request.form.get("questionNumber","5")
    difficulty=request.form.get("difficulty","Easy")
    question_type=request.form.get("questionType","MCQ")

    if not study_material.strip():
        return jsonify({"error":"Please upload a document or enter study material."}),400

    prompt=f"""
You are an educational quiz generator.

Create a quiz using ONLY the study material provided below.

Study Material:

{study_material}

Requirements:

- Generate exactly {question_number} questions.
- Difficulty: {difficulty}
- Question type: {question_type}
- Include the correct answer.
- Include a short explanation.
- Avoid duplicate questions.
- Do not add information that is not present in the study material.

Return ONLY valid JSON.

Use exactly this format:

{{
    "questions": [
        {{
            "question": "Question text",
            "options": [
                "Option A",
                "Option B",
                "Option C",
                "Option D"
            ],
            "answer": "Correct option",
            "explanation": "Short explanation"
        }}
    ]
}}
"""

    response=client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt,
        config={"response_mime_type":"application/json"}
    )

    return jsonify({"quiz":response.text})

@app.route("/generate_daily_challenge",methods=["POST"])
def generate_daily_challenge():
    topic=request.form.get("topic","Random")
    difficulty=request.form.get("difficulty","Medium")
    question_number=request.form.get("questionNumber","5")
    question_type=request.form.get("questionType","MCQ")

    if topic=="Random":
        topic_instruction="""
Choose one interesting educational topic from:
Data Structures, DBMS, Operating Systems,
Computer Organization, Java Programming,
Digital Electronics, Python Programming,
Web Development, Artificial Intelligence,
General Knowledge, or Aptitude and Reasoning.
"""
    else:
        topic_instruction=f"""
The selected topic is:
{topic}
"""

    if question_type=="True/False":
        format_instruction="""
Each question must have exactly two options:
True
False
"""
    else:
        format_instruction="""
Each question must have exactly four options.
"""

    prompt=f"""
You are the Daily Challenge AI for an educational website called QuizGen AI.

{topic_instruction}

Create a daily quiz for students.

Requirements:

- Generate exactly {question_number} questions.
- Difficulty: {difficulty}
- Question type: {question_type}.
- {format_instruction}
- Every question must have one correct answer.
- Include a short explanation.
- Questions must be educational and factually correct.
- Avoid duplicate questions.
- Make the questions engaging.
- Do not include questions about current politics, controversial topics, or personal information.

Return ONLY valid JSON.

Use exactly this format:

{{
    "questions": [
        {{
            "question": "Question text",
            "options": [
                "Option A",
                "Option B",
                "Option C",
                "Option D"
            ],
            "answer": "Correct option",
            "explanation": "Short explanation"
        }}
    ]
}}
"""

    try:
        response=client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=prompt,
            config={"response_mime_type":"application/json"}
        )
        return jsonify({"quiz":response.text})
    except Exception as e:
        return jsonify({"error":str(e)}),500

if __name__=="__main__":
    app.run(debug=True)