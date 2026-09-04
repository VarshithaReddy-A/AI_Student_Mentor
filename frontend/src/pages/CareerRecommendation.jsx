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
    skills: "",
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

  // Load user details and saved resume skills
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
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch resume");
        }

        return res.json();
      })
      .then((data) => {
        if (
          data.found &&
          Array.isArray(data.result?.skills) &&
          data.result.skills.length > 0
        ) {
          setForm((prev) => ({
            ...prev,
            skills: data.result.skills.join(", "),
          }));
        }
      })
      .catch((error) => {
        console.error("Resume fetch error:", error);
      });
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle interest selection
  const handleInterestChange = (interest) => {
    setForm((prev) => {
      const exists = prev.interests.includes(interest);

      return {
        ...prev,
        interests: exists
          ? prev.interests.filter(
              (item) => item !== interest
            )
          : [...prev.interests, interest],
      };
    });
  };

  // Submit career recommendation
  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Please enter your name.");
      return;
    }

    if (!form.education.trim()) {
      toast.error("Please enter your education.");
      return;
    }

    if (!form.branch.trim()) {
      toast.error("Please enter your branch.");
      return;
    }

    if (!form.work_style) {
      toast.error("Please select a work preference.");
      return;
    }

    if (form.interests.length === 0) {
      toast.error("Please select at least one interest.");
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
      toast.error(
        "Please enter your other work preference."
      );
      return;
    }

    const interestList = [
      ...form.interests.filter(
        (interest) => interest !== "Others"
      ),
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
          data.error ||
            "Could not get career recommendations."
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

  return (
    <div className="career-recommendation">

      {/* Header */}
      <div className="career-header">
        <div className="career-header-icon">🎯</div>

        <div>
          <h1>Career Recommendation</h1>

          <p>
            Tell us about yourself and discover careers
            that match your skills and interests.
          </p>
        </div>
      </div>

      {/* Main Form */}
      <form
        onSubmit={handleSubmit}
        className="career-form"
      >

        {/* Goal Selection */}
        <div className="career-section">
          <h2>What is your goal?</h2>

          <div className="career-goal-buttons">

            <button
              type="button"
              className={`career-goal-btn ${
                goal === "job" ? "active" : ""
              }`}
              onClick={() => setGoal("job")}
            >
              💼
              <span>Find a Job</span>
            </button>

            <button
              type="button"
              className={`career-goal-btn ${
                goal === "higher_education"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setGoal("higher_education")
              }
            >
              🎓
              <span>Higher Education</span>
            </button>

          </div>
        </div>

        {/* Personal Information */}
        <div className="career-section">
          <h2>👤 Personal Information</h2>

          <div className="career-input-grid">

            <div className="career-field">
              <label htmlFor="name">
                Name
              </label>

              <input
                id="name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your name"
              />
            </div>

            <div className="career-field">
              <label htmlFor="education">
                Education
              </label>

              <input
                id="education"
                type="text"
                name="education"
                value={form.education}
                onChange={handleChange}
                placeholder="e.g. B.Tech"
              />
            </div>

            <div className="career-field">
              <label htmlFor="branch">
                Branch
              </label>

              <input
                id="branch"
                type="text"
                name="branch"
                value={form.branch}
                onChange={handleChange}
                placeholder="e.g. CSE"
              />
            </div>

            <div className="career-field">
              <label htmlFor="current_year">
                Current Year
              </label>

              <input
                id="current_year"
                type="text"
                name="current_year"
                value={form.current_year}
                onChange={handleChange}
                placeholder="e.g. 2nd Year"
              />
            </div>

            <div className="career-field">
              <label htmlFor="cgpa">
                CGPA
              </label>

              <input
                id="cgpa"
                type="text"
                name="cgpa"
                value={form.cgpa}
                onChange={handleChange}
                placeholder="e.g. 8.5"
              />
            </div>

            <div className="career-field career-field-full">
              <label htmlFor="skills">
                Skills
              </label>

              <input
                id="skills"
                type="text"
                name="skills"
                value={form.skills}
                onChange={handleChange}
                placeholder="e.g. Python, React, SQL, Java"
              />
            </div>

          </div>
        </div>

        {/* Interests */}
        <div className="career-section">
          <h2>💡 Select Your Interests</h2>

          <p className="career-section-description">
            Select all areas that interest you.
          </p>

          <div className="career-interest-grid">

            {INTEREST_OPTIONS.map((interest) => {
              const selected =
                form.interests.includes(interest);

              return (
                <label
                  key={interest}
                  className={`career-interest ${
                    selected ? "selected" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() =>
                      handleInterestChange(interest)
                    }
                  />

                  <span className="career-checkbox">
                    {selected ? "✓" : ""}
                  </span>

                  <span>{interest}</span>
                </label>
              );
            })}

          </div>

          {/* Other Interest */}
          {form.interests.includes("Others") && (
            <div className="career-other-field">
              <label htmlFor="otherInterest">
                Specify your interest
              </label>

              <input
                id="otherInterest"
                type="text"
                name="otherInterest"
                value={form.otherInterest}
                onChange={handleChange}
                placeholder="Enter your interest"
              />
            </div>
          )}
        </div>

        {/* Preferences */}
        <div className="career-section">
          <h2>⚙️ Your Preferences</h2>

          <div className="career-preference-grid">

            {/* Coding */}
            <div className="career-field">
              <label htmlFor="likes_coding">
                Do you like coding?
              </label>

              <select
                id="likes_coding"
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
            </div>

            {/* Logic */}
            <div className="career-field">
              <label htmlFor="likes_logic">
                Do you like logical problem solving?
              </label>

              <select
                id="likes_logic"
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
            </div>

            {/* Design */}
            <div className="career-field">
              <label htmlFor="likes_design">
                Do you like designing?
              </label>

              <select
                id="likes_design"
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
            </div>

            {/* Work Style */}
            <div className="career-field">
              <label htmlFor="work_style">
                Preferred Work Style
              </label>

              <select
                id="work_style"
                name="work_style"
                value={form.work_style}
                onChange={handleChange}
              >
                <option value="">
                  Select work preference
                </option>

                {WORK_OPTIONS.map((option) => (
                  <option
                    key={option}
                    value={option.toLowerCase()}
                  >
                    {option}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Other Work Style */}
          {form.work_style === "others" && (
            <div className="career-other-field">
              <label htmlFor="work_style_other">
                Specify your work preference
              </label>

              <input
                id="work_style_other"
                type="text"
                name="work_style_other"
                value={form.work_style_other}
                onChange={handleChange}
                placeholder="Enter your preferred work style"
              />
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="career-submit-btn"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="career-spinner"></span>
              Getting Recommendations...
            </>
          ) : (
            <>
              ✨ Get Career Recommendations
            </>
          )}
        </button>

      </form>

      {/* Results */}
      {result && (
        <div className="recommendation-result">

          <div className="recommendation-result-header">
            <h2>🎯 Career Recommendations</h2>

            <p>
              Based on your profile, interests and
              preferences.
            </p>
          </div>

          {/* Optional overall message */}
          {result.message && (
            <div className="career-result-message">
              {result.message}
            </div>
          )}

          {/* Recommendation Cards */}
          {Array.isArray(result.recommendations) &&
          result.recommendations.length > 0 ? (
            <div className="career-results-grid">

              {result.recommendations.map(
                (career, index) => (
                  <div
                    className="career-card"
                    key={index}
                  >

                    <div className="career-card-top">
                      <div className="career-card-number">
                        #{index + 1}
                      </div>

                      <div className="career-card-match">
                        {career.match !== undefined
                          ? `${career.match}% Match`
                          : "Recommended"}
                      </div>
                    </div>

                    <h3>
                      {career.role ||
                        career.title ||
                        career.career ||
                        "Career"}
                    </h3>

                    {career.description && (
                      <p className="career-card-description">
                        {career.description}
                      </p>
                    )}

                    {career.match !== undefined && (
                      <div className="career-match-section">

                        <div className="career-match-label">
                          <span>
                            Career Match
                          </span>

                          <span>
                            {career.match}%
                          </span>
                        </div>

                        <div className="career-match-bar">
                          <div
                            className="career-match-fill"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(
                                  0,
                                  Number(
                                    career.match
                                  ) || 0
                                )
                              )}%`,
                            }}
                          />
                        </div>

                      </div>
                    )}

                    {career.required_skills && (
                      <div className="career-card-section">

                        <strong>
                          🛠 Required Skills
                        </strong>

                        <p>
                          {Array.isArray(
                            career.required_skills
                          )
                            ? career.required_skills.join(
                                ", "
                              )
                            : career.required_skills}
                        </p>

                      </div>
                    )}

                    {career.salary && (
                      <div className="career-card-section">

                        <strong>
                          💰 Salary
                        </strong>

                        <p>
                          {career.salary}
                        </p>

                      </div>
                    )}

                    {career.reason && (
                      <div className="career-card-section">

                        <strong>
                          💡 Why this career?
                        </strong>

                        <p>
                          {career.reason}
                        </p>

                      </div>
                    )}

                  </div>
                )
              )}

            </div>
          ) : (
            <div className="career-no-results">
              <h3>
                No recommendations available
              </h3>

              <p>
                Please try again with more skills and
                interests.
              </p>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default CareerRecommendation;
