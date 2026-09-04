from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import fitz  # PyMuPDF
import json
import os
import re

from utils.analyzer import (
    analyze_resume,
    recommend_careers,
    recommend_careers_from_profile,
    skill_gap_detection,
)

# ─────────────────────────────────────────────────────────────────────────────
# GROQ AI ANALYZER
# ─────────────────────────────────────────────────────────────────────────────

try:
    from utils.gemini_analyzer import analyze_resume_ai
    GROQ_AVAILABLE = True
    print("Groq AI analyzer loaded successfully.")
except Exception as e:
    GROQ_AVAILABLE = False
    print("Groq analyzer unavailable:", e)


app = Flask(__name__)
CORS(app)


# ─────────────────────────────────────────────────────────────────────────────
# DATABASE
# ─────────────────────────────────────────────────────────────────────────────

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

app.config["SQLALCHEMY_DATABASE_URI"] = (
    f"sqlite:///{os.path.join(BASE_DIR, 'career_mentor.db')}"
)

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


class User(db.Model):

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    name = db.Column(
        db.String(200),
        nullable=False
    )

    email = db.Column(
        db.String(200),
        unique=True,
        nullable=False
    )

    password_hash = db.Column(
        db.String(256),
        nullable=False
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(
            self.password_hash,
            password
        )


class ResumeRecord(db.Model):

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    email = db.Column(
        db.String(200),
        unique=True,
        nullable=False
    )

    filename = db.Column(
        db.String(300),
        nullable=False
    )

    score = db.Column(
        db.Integer,
        nullable=False
    )

    result_json = db.Column(
        db.Text,
        nullable=False
    )


# Create database tables
with app.app_context():
    db.create_all()


# ─────────────────────────────────────────────────────────────────────────────
# HELPER FUNCTIONS
# ─────────────────────────────────────────────────────────────────────────────

def extract_pdf_text(file_stream) -> str:
    """
    Extract text from uploaded PDF.
    """

    pdf = fitz.open(
        stream=file_stream.read(),
        filetype="pdf"
    )

    text = ""

    for page in pdf:
        text += page.get_text()

    pdf.close()

    return text


# ─────────────────────────────────────────────────────────────────────────────
# HOME
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/")
def home():

    return jsonify({
        "service": "AI Career Mentor Backend",
        "status": "running",
        "groq": GROQ_AVAILABLE
    })


# ─────────────────────────────────────────────────────────────────────────────
# AUTH - REGISTER
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/auth/register", methods=["POST"])
def register():

    payload = request.get_json()

    if not payload:
        return jsonify({
            "error": "No data provided"
        }), 400

    name = payload.get(
        "name",
        ""
    ).strip()

    email = payload.get(
        "email",
        ""
    ).strip().lower()

    password = payload.get(
        "password",
        ""
    ).strip()

    if not name or not email or not password:

        return jsonify({
            "error": "Name, email and password are required"
        }), 400

    if not re.match(
        r"^[^@\s]+@[^@\s]+\.[^@\s]+$",
        email
    ):

        return jsonify({
            "error": "Invalid email address"
        }), 400

    if len(password) < 6:

        return jsonify({
            "error": "Password must be at least 6 characters"
        }), 400

    existing_user = User.query.filter_by(
        email=email
    ).first()

    if existing_user:

        return jsonify({
            "error": "An account with that email already exists"
        }), 409

    user = User(
        name=name,
        email=email
    )

    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "message": "Account created successfully",
        "user": {
            "name": user.name,
            "email": user.email
        }
    }), 201


# ─────────────────────────────────────────────────────────────────────────────
# AUTH - LOGIN
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/auth/login", methods=["POST"])
def login():

    payload = request.get_json()

    if not payload:

        return jsonify({
            "error": "No data provided"
        }), 400

    email = payload.get(
        "email",
        ""
    ).strip().lower()

    password = payload.get(
        "password",
        ""
    ).strip()

    if not email or not password:

        return jsonify({
            "error": "Email and password are required"
        }), 400

    user = User.query.filter_by(
        email=email
    ).first()

    if not user or not user.check_password(password):

        return jsonify({
            "error": "Incorrect email or password"
        }), 401

    return jsonify({
        "message": "Login successful",
        "user": {
            "name": user.name,
            "email": user.email
        }
    })


# ─────────────────────────────────────────────────────────────────────────────
# GET USER
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/auth/user/<email>", methods=["GET"])
def get_user(email):

    user = User.query.filter_by(
        email=email.strip().lower()
    ).first()

    if not user:

        return jsonify({
            "found": False
        })

    return jsonify({
        "found": True,
        "user": {
            "name": user.name,
            "email": user.email
        }
    })


# ─────────────────────────────────────────────────────────────────────────────
# RESUME UPLOAD + GROQ ATS ANALYSIS
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/upload", methods=["POST"])
def upload_resume():

    """
    Upload PDF resume and analyze it using Groq AI.

    Returns:
    - ATS score
    - Resume score
    - Skills
    - Missing skills
    - Strengths
    - Weaknesses
    - Suggestions
    - Career recommendations
    """

    if "resume" not in request.files:

        return jsonify({
            "error": "No file uploaded"
        }), 400

    file = request.files["resume"]

    if file.filename == "":

        return jsonify({
            "error": "No file selected"
        }), 400

    # Check PDF
    if not file.filename.lower().endswith(".pdf"):

        return jsonify({
            "error": "Only PDF resumes are supported"
        }), 400

    # Extract PDF text
    try:

        text = extract_pdf_text(file)

    except Exception as e:

        return jsonify({
            "error": f"Could not read PDF: {str(e)}"
        }), 422

    # Check empty PDF
    if not text.strip():

        return jsonify({
            "error": "PDF appears to be empty or image-only."
        }), 422


    # ─────────────────────────────────────────────────────────────────────
    # GROQ AI ANALYSIS
    # ─────────────────────────────────────────────────────────────────────

    if GROQ_AVAILABLE:

        try:

            result = analyze_resume_ai(text)

            # -------------------------------------------------------------
            # NORMALIZE SCORE
            # -------------------------------------------------------------

            score = result.get(
                "resume_score",
                result.get(
                    "ats_score",
                    result.get("score", 0)
                )
            )

            try:
                score = int(score)
            except (ValueError, TypeError):
                score = 0

            score = max(
                0,
                min(100, score)
            )


            # -------------------------------------------------------------
            # NORMALIZE FIELDS
            # -------------------------------------------------------------

            skills = result.get(
                "skills",
                []
            )

            missing_skills = result.get(
                "missing_skills",
                []
            )

            strengths = result.get(
                "strengths",
                []
            )

            weaknesses = result.get(
                "weaknesses",
                []
            )

            suggestions = result.get(
                "suggestions",
                []
            )

            career_recommendation = result.get(
                "career_recommendation",
                []
            )


            # -------------------------------------------------------------
            # FINAL RESPONSE
            # -------------------------------------------------------------

            final_result = {

                "score": score,

                "resume_score": score,

                "ats_score": score,

                "skills": skills,

                "missing_skills": missing_skills,

                "strengths": strengths,

                "weaknesses": weaknesses,

                "suggestions": suggestions,

                "career_recommendation": career_recommendation,

                # Keep career field for frontend compatibility
                "career": career_recommendation
            }

            return jsonify(final_result)


        except Exception as ai_err:

            app.logger.exception(
                "Groq analysis failed"
            )

            return jsonify({
                "error": f"Groq AI analysis failed: {str(ai_err)}"
            }), 500


    # ─────────────────────────────────────────────────────────────────────
    # FALLBACK RULE-BASED ANALYSIS
    # ─────────────────────────────────────────────────────────────────────

    try:

        result = analyze_resume(text)

        careers = recommend_careers(text)

        result["career"] = careers

        if "score" not in result:

            result["score"] = 0

        return jsonify(result)

    except Exception as fallback_err:

        app.logger.exception(
            "Fallback analysis failed"
        )

        return jsonify({
            "error": f"Resume analysis failed: {str(fallback_err)}"
        }), 500


# ─────────────────────────────────────────────────────────────────────────────
# CAREER RECOMMENDATION
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/career-recommendation", methods=["POST"])
def career_recommendation():

    payload = request.get_json()

    if not payload:

        return jsonify({
            "error": "No profile data provided"
        }), 400

    profile = {

        "name": payload.get(
            "name",
            "Student"
        ),

        "education": payload.get(
            "education",
            ""
        ),

        "branch": payload.get(
            "branch",
            ""
        ),

        "current_year": payload.get(
            "current_year",
            ""
        ),

        "cgpa": payload.get(
            "cgpa",
            ""
        ),

        "skills": payload.get(
            "skills",
            []
        ),

        "interests": payload.get(
            "interests",
            []
        ),

        "likes_coding": payload.get(
            "likes_coding",
            False
        ),

        "likes_logic": payload.get(
            "likes_logic",
            False
        ),

        "likes_design": payload.get(
            "likes_design",
            False
        ),

        "goal": payload.get(
            "goal",
            "job"
        ),

        "work_style": payload.get(
            "work_style",
            "hybrid"
        )
    }

    recommendations = recommend_careers_from_profile(
        profile
    )

    return jsonify({
        "name": profile["name"],
        "recommendations": recommendations
    })


# ─────────────────────────────────────────────────────────────────────────────
# SKILL GAP
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/skill-gap", methods=["POST"])
def skill_gap():

    payload = request.get_json()

    if not payload:

        return jsonify({
            "error": "No skill profile provided"
        }), 400

    role = payload.get(
        "role",
        "Full Stack Developer"
    )

    skills = payload.get(
        "skills",
        []
    )

    result = skill_gap_detection(
        role,
        skills
    )

    return jsonify(result)


# ─────────────────────────────────────────────────────────────────────────────
# SAVE RESUME
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/resume/save", methods=["POST"])
def save_resume():

    payload = request.get_json()

    if not payload:

        return jsonify({
            "error": "No data provided"
        }), 400

    email = payload.get(
        "email",
        ""
    ).strip()

    filename = payload.get(
        "filename",
        "resume.pdf"
    ).strip()

    result = payload.get(
        "result",
        {}
    )

    if not email:

        return jsonify({
            "error": "email is required"
        }), 400

    score = result.get(
        "score",
        result.get(
            "resume_score",
            result.get(
                "ats_score",
                0
            )
        )
    )

    try:
        score = int(score)
    except (ValueError, TypeError):
        score = 0

    score = max(
        0,
        min(100, score)
    )

    record = ResumeRecord.query.filter_by(
        email=email
    ).first()

    if record:

        record.filename = filename
        record.score = score
        record.result_json = json.dumps(
            result
        )

    else:

        record = ResumeRecord(

            email=email,

            filename=filename,

            score=score,

            result_json=json.dumps(
                result
            )
        )

        db.session.add(record)

    db.session.commit()

    return jsonify({
        "message": "saved",
        "score": record.score
    })


# ─────────────────────────────────────────────────────────────────────────────
# GET SAVED RESUME
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/resume/<email>", methods=["GET"])
def get_resume(email):

    record = ResumeRecord.query.filter_by(
        email=email
    ).first()

    if not record:

        return jsonify({
            "found": False
        })

    return jsonify({

        "found": True,

        "filename": record.filename,

        "score": record.score,

        "result": json.loads(
            record.result_json
        )
    })


# ─────────────────────────────────────────────────────────────────────────────
# DELETE SAVED RESUME
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/resume/<email>", methods=["DELETE"])
def delete_resume(email):

    record = ResumeRecord.query.filter_by(
        email=email
    ).first()

    if not record:

        return jsonify({
            "error": "No record found"
        }), 404

    db.session.delete(record)

    db.session.commit()

    return jsonify({
        "message": "deleted"
    })


# ─────────────────────────────────────────────────────────────────────────────
# RUN SERVER
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))

    app.run(
        host="0.0.0.0",
        port=port
    )