// CareerRecommendation.jsx

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import "./CareerRecommendation.css";

const API_URL = "https://ai-student-mentor-n1cb.onrender.com";

const INTEREST_OPTIONS = [
  "AI / Machine Learning",
  "Web Development",
  "Data Science",
  "Mobile Development",
  "Cybersecurity",
  "Cloud & DevOps",
  "Game Development",
  "UI/UX Design",
  "Blockchain",
  "Research & Academia",
  "Database Management",
  "Networking",
  "Others",
];

const WORK_OPTIONS = [
  "Remote",
  "Office",
  "Hybrid",
  "Flexible",
  "Others",
];

function CareerRecommendation() {
  const [form, setForm] = useState({
    name: "",
    education: "",
    branch: "",
    current_year: "",
    cgpa: "",
    skills: [],
    interests: [],
    likes_coding: "",
    likes_logic: "",
    likes_design: "",
    work_style: "",
    work_style_other: "",
    otherInterest: "",
  });

  const [goal, setGoal] = useState("job");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [skillInput, setSkillInput] = useState("");
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const [interestOpen, setInterestOpen] = useState(false);

  // ============================================================
  // LOAD USER DATA + RESUME SKILLS
  // ============================================================

  useEffect(() => {
    const email = localStorage.getItem("userEmail") || "";
    const name = localStorage.getItem("userName") || "";

    if (name) {
      setForm((prev) => ({
        ...prev,
        name,
      }));
    }

    if (!email) return;

    fetch(
      `${API_URL}/resume/${encodeURIComponent(email)}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (
          data.found &&
          Array.isArray(data.result?.skills) &&
          data.result.skills.length > 0
        ) {
          setForm((prev) => ({
            ...prev,
            skills: data.result.skills,
          }));
        }
      })
      .catch((error) => {
        console.error("Resume fetch error:", error);
      });
  }, []);

  // ============================================================
  // HANDLE NORMAL INPUT CHANGES
  // ============================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ============================================================
  // HANDLE INTERESTS
  // ============================================================

  const handleInterestChange = (interest) => {
    setForm((prev) => {
      const exists = prev.interests.includes(interest);

      return {
        ...prev,
        interests: exists
          ? prev.interests.filter((item) => item !== interest)
          : [...prev.interests, interest],
      };
    });
  };

  // ============================================================
  // SKILL INPUT
  // ============================================================

  const commonSkills = [
    "Python",
    "Java",
    "JavaScript",
    "React",
    "HTML",
    "CSS",
    "Bootstrap",
    "SQL",
    "MySQL",
    "MongoDB",
    "Node.js",
    "Express.js",
    "C",
    "C++",
    "Machine Learning",
    "Deep Learning",
    "Data Science",
    "Git",
    "GitHub",
    "AWS",
    "Docker",
    "Figma",
  ];

  const handleSkillInput = (e) => {
    const value = e.target.value;

    setSkillInput(value);

    if (value.trim()) {
      const filtered = commonSkills.filter(
        (skill) =>
          skill.toLowerCase().includes(value.toLowerCase()) &&
          !form.skills.includes(skill)
      );

      setSkillSuggestions(filtered.slice(0, 6));
    } else {
      setSkillSuggestions([]);
    }
  };

  const addSkill = (skill) => {
    if (!skill.trim()) return;

    if (!form.skills.includes(skill.trim())) {
      setForm((prev) => ({
        ...prev,
        skills: [...prev.skills, skill.trim()],
      }));
    }

    setSkillInput("");
    setSkillSuggestions([]);
  };

  const removeSkill = (skill) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((item) => item !== skill),
    }));
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (skillInput.trim()) {
        addSkill(skillInput.trim());
      }
    }
  };

  // ============================================================
  // SUBMIT CAREER RECOMMENDATION
  // ============================================================

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.education.trim()) {
      toast.error("Please enter your education.");
      return;
    }

    if (!form.branch.trim()) {
      toast.error("Please enter your branch.");
      return;
    }

    if (!form.current_year.trim()) {
      toast.error("Please enter your current year.");
      return;
    }

    if (form.interests.length === 0) {
      toast.error("Please select at least one interest.");
      return;
    }

    if (!form.likes_coding) {
      toast.error("Please select your coding preference.");
      return;
    }

    if (!form.likes_logic) {
      toast.error("Please select your logical problem-solving preference.");
      return;
    }

    if (!form.likes_design) {
      toast.error("Please select your designing preference.");
      return;
    }

    if (!form.work_style) {
      toast.error("Please select a work preference.");
      return;
    }

    if (
      form.interests.includes("Others") &&
      !form.otherInterest.trim()
    ) {
      toast.error("Please enter your other interest.");
      return;
    }

    if (
      form.work_style === "others" &&
      !form.work_style_other.trim()
    ) {
      toast.error("Please enter your other work preference.");
      return;
    }

    const interestList = [
      ...form.interests.filter((item) => item !== "Others"),
      ...(form.interests.includes("Others") &&
      form.otherInterest.trim()
        ? [form.otherInterest.trim()]
        : []),
    ];

    const workStyle =
      form.work_style === "others"
        ? form.work_style_other.trim() || "others"
        : form.work_style;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(
        `${API_URL}/career-recommendation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name,
            education: form.education,
            branch: form.branch,
            current_year: form.current_year,
            cgpa: form.cgpa,
            skills: form.skills,
            interests: interestList,
            likes_coding: form.likes_coding,
            likes_logic: form.likes_logic,
            likes_design: form.likes_design,
            goal: goal,
            work_style: workStyle,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(
          data.error || "Could not get recommendations."
        );
        return;
      }

      setResult(data);

      toast.success("Recommendations ready!");
    } catch (error) {
      console.error(
        "Career recommendation error:",
        error
      );

      toast.error(
        "Could not reach the backend. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // INTEREST DISPLAY TEXT
  // ============================================================

  const interestText =
    form.interests.length === 0
      ? "Select your interests"
      : `${form.interests.length} interest${
          form.interests.length > 1 ? "s" : ""
        } selected`;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="cr-page">

      {/* HEADER */}
      <div className="cr-header">
        <h1>🎯 Career Recommendation</h1>

        <p>
          Tell us about yourself and discover careers that
          match your skills and interests.
        </p>
      </div>

      {/* FORM */}
      <form
        className="cr-form"
        onSubmit={handleSubmit}
      >

        {/* ====================================================
            GOAL
        ==================================================== */}

        <div>
          <h2 className="cr-section-title">
            What is your goal?
          </h2>

          <div className="cr-goal-row">

            <button
              type="button"
              className={`cr-goal-btn ${
                goal === "job" ? "active" : ""
              }`}
              onClick={() => setGoal("job")}
            >
              💼 Find a Job
            </button>

            <button
              type="button"
              className={`cr-goal-btn ${
                goal === "higher_education" ? "active" : ""
              }`}
              onClick={() =>
                setGoal("higher_education")
              }
            >
              🎓 Higher Education
            </button>

          </div>
        </div>

        {/* ====================================================
            PERSONAL INFORMATION
        ==================================================== */}

        <div>

          <h2 className="cr-section-title">
            👤 Personal Information
          </h2>

          <div className="cr-grid">

            {/* NAME */}
            <div className="cr-field">
              <label>Name</label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your name"
              />
            </div>

            {/* EDUCATION */}
            <div className="cr-field">
              <label>
                Education
              </label>

              <input
                type="text"
                name="education"
                value={form.education}
                onChange={handleChange}
                placeholder="e.g. B.Tech"
              />
            </div>

            {/* BRANCH */}
            <div className="cr-field">
              <label>Branch</label>

              <input
                type="text"
                name="branch"
                value={form.branch}
                onChange={handleChange}
                placeholder="e.g. CSE"
              />
            </div>

            {/* CURRENT YEAR */}
            <div className="cr-field">
              <label>
                Current Year
              </label>

              <input
                type="text"
                name="current_year"
                value={form.current_year}
                onChange={handleChange}
                placeholder="e.g. 2nd Year"
              />
            </div>

            {/* CGPA */}
            <div className="cr-field">
              <label>
                CGPA
              </label>

              <input
                type="text"
                name="cgpa"
                value={form.cgpa}
                onChange={handleChange}
                placeholder="e.g. 8.5"
              />
            </div>

            {/* SKILLS */}
            <div className="cr-field cr-field-full">

              <label>
                Skills
                <span> (Press Enter to add)</span>
              </label>

              <div className="cr-skill-wrap">

                {form.skills.map((skill) => (
                  <span
                    className="cr-skill-tag"
                    key={skill}
                  >
                    {skill}

                    <button
                      type="button"
                      className="cr-skill-remove"
                      onClick={() =>
                        removeSkill(skill)
                      }
                    >
                      ×
                    </button>
                  </span>
                ))}

                <input
                  type="text"
                  className="cr-skill-input"
                  value={skillInput}
                  onChange={handleSkillInput}
                  onKeyDown={handleSkillKeyDown}
                  placeholder={
                    form.skills.length === 0
                      ? "e.g. Python, React, SQL"
                      : "Add another skill..."
                  }
                />

              </div>

              {/* SKILL SUGGESTIONS */}
              {skillSuggestions.length > 0 && (
                <ul className="cr-skill-dropdown">

                  {skillSuggestions.map(
                    (skill) => (
                      <li
                        key={skill}
                        className="cr-skill-dropdown-item"
                        onClick={() =>
                          addSkill(skill)
                        }
                      >
                        {skill}
                      </li>
                    )
                  )}

                </ul>
              )}

            </div>

          </div>

        </div>

        {/* ====================================================
            INTERESTS
        ==================================================== */}

        <div>

          <h2 className="cr-section-title">
            💡 Select Your Interests
          </h2>

          <p className="cr-section-description">
            Select all areas that interest you.
          </p>

          <div className="cr-field">

            <label>Interests</label>

            <div
              className={`cr-interest-trigger ${
                interestOpen ? "open" : ""
              }`}
              onClick={() =>
                setInterestOpen(!interestOpen)
              }
              tabIndex={0}
            >
              <span
                className={
                  form.interests.length === 0
                    ? "cr-interest-placeholder"
                    : "cr-interest-selected"
                }
              >
                {interestText}
              </span>

              <span className="cr-interest-arrow">
                {interestOpen ? "▲" : "▼"}
              </span>
            </div>

            {interestOpen && (
              <div className="cr-interest-dropdown">

                {INTEREST_OPTIONS.map(
                  (interest) => (
                    <label
                      className="cr-interest-option"
                      key={interest}
                      onClick={(e) =>
                        e.stopPropagation()
                      }
                    >

                      <input
                        type="checkbox"
                        checked={form.interests.includes(
                          interest
                        )}
                        onChange={() =>
                          handleInterestChange(
                            interest
                          )
                        }
                      />

                      <span className="cr-interest-check-box"></span>

                      <span>{interest}</span>

                    </label>
                  )
                )}

              </div>
            )}

          </div>

          {/* OTHER INTEREST */}
          {form.interests.includes("Others") && (
            <input
              type="text"
              className="cr-others-input"
              name="otherInterest"
              value={form.otherInterest}
              onChange={handleChange}
              placeholder="Enter your other interest"
            />
          )}

        </div>

        {/* ====================================================
            PREFERENCES
        ==================================================== */}

        <div>

          <h2 className="cr-section-title">
            ⚙️ Your Preferences
          </h2>

          <div className="cr-prefs">

            {/* CODING */}
            <label
              className={`cr-check ${
                form.likes_coding
                  ? "checked"
                  : ""
              }`}
            >
              <span>
                Do you like coding?
              </span>

              <select
                className="cr-select"
                name="likes_coding"
                value={form.likes_coding}
                onChange={handleChange}
              >
                <option value="">
                  Select an option
                </option>

                <option value="yes">
                  Yes
                </option>

                <option value="no">
                  No
                </option>
              </select>
            </label>

            {/* LOGIC */}
            <label
              className={`cr-check ${
                form.likes_logic
                  ? "checked"
                  : ""
              }`}
            >
              <span>
                Do you like logical problem solving?
              </span>

              <select
                className="cr-select"
                name="likes_logic"
                value={form.likes_logic}
                onChange={handleChange}
              >
                <option value="">
                  Select an option
                </option>

                <option value="yes">
                  Yes
                </option>

                <option value="no">
                  No
                </option>
              </select>
            </label>

            {/* DESIGN */}
            <label
              className={`cr-check ${
                form.likes_design
                  ? "checked"
                  : ""
              }`}
            >
              <span>
                Do you like designing?
              </span>

              <select
                className="cr-select"
                name="likes_design"
                value={form.likes_design}
                onChange={handleChange}
              >
                <option value="">
                  Select an option
                </option>

                <option value="yes">
                  Yes
                </option>

                <option value="no">
                  No
                </option>
              </select>
            </label>

          </div>

        </div>

        {/* ====================================================
            WORK PREFERENCE
        ==================================================== */}

        <div>

          <div className="cr-ws-row">

            <span className="cr-ws-label">
              Preferred Work Style
            </span>

            {WORK_OPTIONS.map(
              (option) => {

                const value =
                  option.toLowerCase();

                return (
                  <button
                    key={option}
                    type="button"
                    className={`cr-ws-btn ${
                      form.work_style === value
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        work_style: value,
                      }))
                    }
                  >
                    {option}
                  </button>
                );
              }
            )}

          </div>

          {/* OTHER WORK STYLE */}
          {form.work_style === "others" && (
            <input
              type="text"
              className="cr-others-input"
              name="work_style_other"
              value={form.work_style_other}
              onChange={handleChange}
              placeholder="Enter your preferred work style"
            />
          )}

        </div>

        {/* ====================================================
            SUBMIT
        ==================================================== */}

        <button
          type="submit"
          className="cr-submit"
          disabled={loading}
        >

          {loading ? (
            <>
              <span className="cr-spin"></span>
              Getting Recommendations...
            </>
          ) : (
            <>
              ✨ Get Career Recommendations
            </>
          )}

        </button>

      </form>

      {/* ======================================================
          RESULTS
      ====================================================== */}

      {result && (
        <div className="cr-results">

          <h2>
            🎯 Career Recommendations
          </h2>

          {Array.isArray(
            result.recommendations
          ) &&
            result.recommendations.map(
              (career, index) => {

                const match = Number(
                  career.match ??
                    career.match_percentage ??
                    0
                );

                const role =
                  career.role ||
                  career.title ||
                  career.career ||
                  "Career";

                const reason =
                  career.reason ||
                  career.description ||
                  career.explanation ||
                  "This career matches your profile.";

                const skills =
                  career.required_skills ||
                  career.skills ||
                  [];

                const salary =
                  career.salary ||
                  career.salary_range ||
                  "Not specified";

                return (
                  <div
                    className="cr-card"
                    key={index}
                    style={{
                      "--mc":
                        index === 0
                          ? "#5b5ef4"
                          : index === 1
                          ? "#0ea5e9"
                          : "#10b981",
                    }}
                  >

                    <div className="cr-card-top">

                      <div>
                        <span className="cr-card-rank">
                          #{index + 1}
                        </span>

                        <span className="cr-card-role">
                          {role}
                        </span>
                      </div>

                      <span
                        className="cr-match-badge"
                        style={{
                          color:
                            match >= 80
                              ? "#10b981"
                              : match >= 60
                              ? "#f59e0b"
                              : "#fb7185",
                          borderColor:
                            match >= 80
                              ? "rgba(16,185,129,0.4)"
                              : match >= 60
                              ? "rgba(245,158,11,0.4)"
                              : "rgba(251,113,133,0.4)",
                        }}
                      >
                        {match}% Match
                      </span>

                    </div>

                    {/* MATCH BAR */}
                    <div className="cr-bar-track">
                      <div
                        className="cr-bar-fill"
                        style={{
                          width: `${Math.min(
                            Math.max(match, 0),
                            100
                          )}%`,
                          background:
                            match >= 80
                              ? "#10b981"
                              : match >= 60
                              ? "#f59e0b"
                              : "#fb7185",
                        }}
                      ></div>
                    </div>

                    {/* REASON */}
                    <p className="cr-card-reason">
                      {reason}
                    </p>

                    {/* META */}
                    <div className="cr-card-meta">

                      <div className="cr-meta-item">

                        <span className="cr-meta-lbl">
                          Required Skills
                        </span>

                        <span className="cr-meta-val">
                          {Array.isArray(skills)
                            ? skills.join(", ")
                            : skills}
                        </span>

                      </div>

                      <div className="cr-meta-item">

                        <span className="cr-meta-lbl">
                          Salary
                        </span>

                        <span className="cr-meta-val cr-salary">
                          {salary}
                        </span>

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          {/* FALLBACK */}
          {(!Array.isArray(
            result.recommendations
          ) ||
            result.recommendations.length === 0) && (
            <div className="cr-card">
              <p className="cr-card-reason">
                No career recommendations were
                returned. Please try again with
                more details.
              </p>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default CareerRecommendation;
