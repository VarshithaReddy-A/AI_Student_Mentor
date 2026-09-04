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

  // Load user name and saved resume skills
  useEffect(() => {
    const email = localStorage.getItem("userEmail") || "";
    const name = localStorage.getItem("userName") || "";

    if (name) {
      setForm((f) => ({
        ...f,
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
          setForm((f) => ({
            ...f,
            skills: data.result.skills,
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

  // Handle interests
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

  // Submit career recommendation
  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.work_style) {
      toast.error("Please select a work preference.");
      return;
    }

    if (form.interests.length === 0) {
      toast.error("Please select at least one interest.");
      return;
    }

    const interestList = [
      ...form.interests.filter((i) => i !== "Others"),

      ...(form.interests.includes("Others") && form.otherInterest
        ? [form.otherInterest]
        : []),
    ];

    const workStyle =
      form.work_style === "others"
        ? form.work_style_other || "others"
        : form.work_style;

    setLoading(true);
    setResult(null);

    try {
      // IMPORTANT:
      // This endpoint is career-recommendation,
      // NOT /resume
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

  return (
    <div className="career-recommendation">

      {/* Your existing UI/form can remain here */}

      <form onSubmit={handleSubmit}>

        {/* Goal */}
        <div>
          <button
            type="button"
            onClick={() => setGoal("job")}
          >
            Find a Job
          </button>

          <button
            type="button"
            onClick={() => setGoal("higher_education")}
          >
            Higher Education
          </button>
        </div>

        {/* Name */}
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Name"
        />

        {/* Education */}
        <input
          type="text"
          name="education"
          value={form.education}
          onChange={handleChange}
          placeholder="Education"
        />

        {/* Branch */}
        <input
          type="text"
          name="branch"
          value={form.branch}
          onChange={handleChange}
          placeholder="Branch"
        />

        {/* Current Year */}
        <input
          type="text"
          name="current_year"
          value={form.current_year}
          onChange={handleChange}
          placeholder="Current Year"
        />

        {/* CGPA */}
        <input
          type="text"
          name="cgpa"
          value={form.cgpa}
          onChange={handleChange}
          placeholder="CGPA"
        />

        {/* Skills */}
        <input
          type="text"
          name="skills"
          value={form.skills}
          onChange={handleChange}
          placeholder="Skills"
        />

        {/* Interests */}
        <div>
          <h3>Select Interests</h3>

          {INTEREST_OPTIONS.map((interest) => (
            <label key={interest}>
              <input
                type="checkbox"
                checked={form.interests.includes(interest)}
                onChange={() =>
                  handleInterestChange(interest)
                }
              />

              {interest}
            </label>
          ))}
        </div>

        {/* Other Interest */}
        {form.interests.includes("Others") && (
          <input
            type="text"
            name="otherInterest"
            value={form.otherInterest}
            onChange={handleChange}
            placeholder="Enter your interest"
          />
        )}

        {/* Coding */}
        <select
          name="likes_coding"
          value={form.likes_coding}
          onChange={handleChange}
        >
          <option value="">Do you like coding?</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>

        {/* Logic */}
        <select
          name="likes_logic"
          value={form.likes_logic}
          onChange={handleChange}
        >
          <option value="">
            Do you like logical problem solving?
          </option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>

        {/* Design */}
        <select
          name="likes_design"
          value={form.likes_design}
          onChange={handleChange}
        >
          <option value="">Do you like designing?</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>

        {/* Work preference */}
        <select
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

        {/* Other work preference */}
        {form.work_style === "others" && (
          <input
            type="text"
            name="work_style_other"
            value={form.work_style_other}
            onChange={handleChange}
            placeholder="Enter your work preference"
          />
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Getting Recommendations..."
            : "Get Career Recommendations"}
        </button>
      </form>

      {/* Result */}
      {result && (
        <div className="recommendation-result">
          <h2>Career Recommendations</h2>

          {Array.isArray(result.recommendations) &&
            result.recommendations.map(
              (career, index) => (
                <div
                  className="career-card"
                  key={index}
                >
                  <h3>
                    {career.role ||
                      career.title ||
                      "Career"}
                  </h3>

                  {career.match !== undefined && (
                    <p>
                      Match: {career.match}%
                    </p>
                  )}

                  {career.required_skills && (
                    <p>
                      Required Skills:{" "}
                      {Array.isArray(
                        career.required_skills
                      )
                        ? career.required_skills.join(
                            ", "
                          )
                        : career.required_skills}
                    </p>
                  )}

                  {career.salary && (
                    <p>
                      Salary: {career.salary}
                    </p>
                  )}
                </div>
              )
            )}
        </div>
      )}
    </div>
  );
}

export default CareerRecommendation;
