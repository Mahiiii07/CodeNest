// src/pages/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { UserPlus, User, Mail, Lock, Users } from "lucide-react";
import Alert from "../components/Alert";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "student",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Client-side validation functions
  const validateEmail = (email) => {
    if (!email) {
      return "Email is required";
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return "Email must be in valid format (e.g., user@example.com). It should contain @ symbol and a valid domain.";
    }
    return null;
  };

  const validateName = (name, fieldName) => {
    if (!name || name.trim() === "") {
      return `${fieldName} is required`;
    }
    if (name.length < 2) {
      return `${fieldName} must be at least 2 characters long`;
    }
    return null;
  };

  const validateUsername = (username) => {
    if (!username || username.trim() === "") {
      return "Username is required";
    }
    if (username.length < 3) {
      return "Username must be at least 3 characters long";
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return "Username can only contain letters, numbers, and underscores";
    }
    return null;
  };

  const validatePassword = (password) => {
    if (!password) {
      return "Password is required";
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters long";
    }
    if (!/(?=.*[a-zA-Z])/.test(password)) {
      return "Password must contain at least one letter";
    }
    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }

    // Real-time validation
    let error = null;
    if (name === "email") {
      error = validateEmail(value);
    } else if (name === "first_name") {
      error = validateName(value, "First name");
    } else if (name === "last_name") {
      error = validateName(value, "Last name");
    } else if (name === "username") {
      error = validateUsername(value);
    } else if (name === "password") {
      error = validatePassword(value);
    }

    if (error) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setFieldErrors({});

    // Client-side validation before submission
    const validationErrors = {};
    const emailError = validateEmail(formData.email);
    const firstNameError = validateName(formData.first_name, "First name");
    const lastNameError = validateName(formData.last_name, "Last name");
    const usernameError = validateUsername(formData.username);
    const passwordError = validatePassword(formData.password);

    if (emailError) validationErrors.email = emailError;
    if (firstNameError) validationErrors.first_name = firstNameError;
    if (lastNameError) validationErrors.last_name = lastNameError;
    if (usernameError) validationErrors.username = usernameError;
    if (passwordError) validationErrors.password = passwordError;

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setError("Please correct the errors below");
      setLoading(false);
      return;
    }

    console.log("Form data being sent:", formData);

    const result = await register(formData);

    if (result.success) {
      //  Check for email verification message
      if (result.email_message) {
        setSuccess(
          `🎉 Registration successful! ${result.email_message} Please check your inbox and click the verification link to activate your account.`
        );
        // Don't navigate immediately, let user see the message
        setTimeout(() => {
          navigate("/login");
        }, 5000); // 5 seconds to read the message
      } else {
        navigate(result.user.role === "faculty" ? "/faculty" : "/student");
      }
    } else {
      // Handle field-specific errors from backend
      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
        setError("Please correct the errors below");
      } else {
        setError(result.error);
      }
    }

    setLoading(false);
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-200/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-cyan-200/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" />
      </div>

      <motion.div {...fadeInUp} className="relative z-10 w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Create Account
            </h1>
            <p className="text-gray-300">
              Create your account and start analyzing code
            </p>
          </div>

          {error && <Alert type="error" message={error} />}
          {success && <Alert type="success" message={success} />}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                      fieldErrors.first_name
                        ? "border-red-500 focus:ring-red-500"
                        : "border-white/20 focus:ring-blue-500"
                    }`}
                    placeholder="First name"
                    required
                  />
                </div>
                {fieldErrors.first_name && (
                  <p className="text-red-400 text-sm mt-1 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {fieldErrors.first_name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                      fieldErrors.last_name
                        ? "border-red-500 focus:ring-red-500"
                        : "border-white/20 focus:ring-blue-500"
                    }`}
                    placeholder="Last name"
                    required
                  />
                </div>
                {fieldErrors.last_name && (
                  <p className="text-red-400 text-sm mt-1 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {fieldErrors.last_name}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                    fieldErrors.username
                      ? "border-red-500 focus:ring-red-500"
                      : "border-white/20 focus:ring-blue-500"
                  }`}
                  placeholder="Choose a username"
                  required
                />
              </div>
              {fieldErrors.username && (
                <p className="text-red-400 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {fieldErrors.username}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                    fieldErrors.email
                      ? "border-red-500 focus:ring-red-500"
                      : "border-white/20 focus:ring-blue-500"
                  }`}
                  placeholder="your@email.com"
                  required
                />
              </div>
              {fieldErrors.email && (
                <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm flex items-start">
                    <span className="mr-2 mt-0.5">⚠️</span>
                    <span>{fieldErrors.email}</span>
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-12 pr-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                    fieldErrors.password
                      ? "border-red-500 focus:ring-red-500"
                      : "border-white/20 focus:ring-blue-500"
                  }`}
                  placeholder="Create a password"
                  required
                />
              </div>
              {fieldErrors.password && (
                <p className="text-red-400 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Role
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="student" className="bg-slate-800">
                    Student
                  </option>
                  <option value="faculty" className="bg-slate-800">
                    Faculty
                  </option>
                </select>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={
                loading ||
                Object.values(fieldErrors).some((error) => error !== null)
              }
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                "Create Account"
              )}
            </motion.button>
          </form>

          <div className="text-center mt-6">
            <p className="text-gray-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                Sign in instead
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
