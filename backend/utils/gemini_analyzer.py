import os
import json
from dotenv import load_dotenv
from groq import Groq

# Load .env file
load_dotenv()

# Get Groq API key
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY is not configured in .env")

# Create Groq client
client = Groq(api_key=GROQ_API_KEY)


def analyze_resume_ai(resume_text):

    prompt = f"""
You are an expert ATS Resume Analyzer and Career Consultant.

Analyze the resume given below.

IMPORTANT RULES:

1. Evaluate ONLY information actually present in the resume.
2. Do not invent skills, experience, education, projects or certifications.
3. Give a realistic ATS score.
4. Do NOT automatically give 100.
5. The score must be between 0 and 100.
6. Return ONLY valid JSON.
7. Do not use markdown.
8. Do not write ```json.
9. Do not add explanations outside JSON.

ATS SCORE:

Contact Information = 10 points
Professional Summary = 10 points
Education = 10 points
Skills = 15 points
Projects = 15 points
Experience/Internship = 15 points
Keywords/Relevance = 10 points
Resume Structure = 10 points
Certifications/Achievements = 5 points

TOTAL = 100 POINTS.

SCORING:

Contact Information:
- Name
- Email
- Phone
- LinkedIn/GitHub if available

Professional Summary:
- Clear summary
- Career objective
- Relevant keywords

Education:
- Degree
- College/university
- Graduation year
- CGPA/percentage if available

Skills:
- Programming languages
- Frameworks
- Databases
- Tools
- Relevant technical skills

Projects:
- Project titles
- Technologies
- Description
- Contributions
- Results/achievements

Experience:
- Company
- Role
- Duration
- Responsibilities
- Achievements

Keywords:
- Relevant industry keywords
- Technical keywords
- Consistent terminology

Resume Structure:
- Clear sections
- Readable structure
- Consistent formatting
- ATS-friendly organization

Certifications/Achievements:
- Relevant certifications
- Awards
- Hackathons
- Achievements

IMPORTANT:
A resume with many skills should NOT automatically receive 100.
Give points according to the complete quality of the resume.

SKILLS:
Return technical and professional skills actually found in the resume.

MISSING SKILLS:
Return useful skills that are missing and would help the candidate's career direction.

STRENGTHS:
Return 3 to 5 genuine strengths based on the resume.

WEAKNESSES:
Return 2 to 5 genuine weaknesses or areas for improvement.

SUGGESTIONS:
Return 3 to 6 practical suggestions to improve ATS compatibility.

CAREER RECOMMENDATIONS:
Return 3 to 5 suitable career roles based on the actual resume.
For each role return a match percentage from 0 to 100.

Return EXACTLY this JSON structure:

{{
    "resume_score": 0,
    "ats_score": 0,
    "skills": [],
    "missing_skills": [],
    "strengths": [],
    "weaknesses": [],
    "suggestions": [],
    "career_recommendation": [
        {{
            "role": "",
            "match": 0
        }}
    ]
}}

RESUME:

{resume_text}
"""

    response = client.chat.completions.create(
       model="openai/gpt-oss-20b",
        messages=[
            {
                "role": "system",
                "content": "You are an expert ATS resume analyzer. Return only valid JSON."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.1,
        response_format={"type": "json_object"}
    )

    text = response.choices[0].message.content.strip()

    result = json.loads(text)

    # Make sure all fields exist
    result.setdefault("resume_score", 0)
    result.setdefault("ats_score", result["resume_score"])
    result.setdefault("skills", [])
    result.setdefault("missing_skills", [])
    result.setdefault("strengths", [])
    result.setdefault("weaknesses", [])
    result.setdefault("suggestions", [])
    result.setdefault("career_recommendation", [])

    # Keep score between 0 and 100
    result["resume_score"] = max(
        0, min(100, int(result["resume_score"]))
    )

    result["ats_score"] = max(
        0, min(100, int(result["ats_score"]))
    )

    return result