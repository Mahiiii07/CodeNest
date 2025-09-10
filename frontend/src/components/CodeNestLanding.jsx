import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { 
Check,
  Mail, 
  Phone, 
  MapPin, 
  Users, 
  GraduationCap,
  BookOpen,
  Shield,
  Twitter,
  Facebook,
  Linkedin,
  Zap,
  BarChart3,
  Globe,
  ArrowRight,
  ChevronDown
} from 'lucide-react';

const Landing = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeSection, setActiveSection] = useState('hero');
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Refs for each section
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const contactRef = useRef(null);
  const facultyRef = useRef(null);
  const studentRef = useRef(null);

  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

         const handleScroll = () => {
       const sections = [
         { id: 'hero', ref: heroRef },
         { id: 'features', ref: featuresRef },
         { id: 'faculty', ref: facultyRef },
         { id: 'student', ref: studentRef },
         { id: 'contact', ref: contactRef }
       ];

       const currentSection = sections.find(section => {
         if (section.ref.current) {
           const rect = section.ref.current.getBoundingClientRect();
           // Account for header height and provide better buffer for section detection
           const headerHeight = 80;
           const buffer = 100; // Increased buffer for better section detection
           return rect.top <= headerHeight + buffer && rect.bottom >= headerHeight + buffer;
         }
         return false;
       });

       if (currentSection) {
         setActiveSection(currentSection.id);
       }
     };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToSection = (sectionId) => {
    const sectionRefs = {
      hero: heroRef,
      features: featuresRef,
      contact: contactRef,
      faculty: facultyRef,
      student: studentRef
    };
  
    const ref = sectionRefs[sectionId];
    if (ref?.current) {
      const headerHeight = document.querySelector("header")?.offsetHeight || 80; 
      const elementTop = ref.current.offsetTop;
      const offsetPosition = elementTop - headerHeight; // precise offset
  
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };
  

  const handleStartTrial = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user?.role === 'faculty') {
      navigate('/faculty/upload');
    } else if (user?.role === 'student') {
      navigate('/student/upload');
    } else {
      navigate('/login');
    }
  };

  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Smart Analysis",
      description: "Advanced plagiarism detection using machine learning algorithms"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Lightning Fast",
      description: "Process multiple projects in seconds with batch analysis"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Detailed Reports",
      description: "Comprehensive reports with similarity scores and visual comparisons"
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Secure & Private",
      description: "Your code is safe with enterprise-grade security"
    }
  ];

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.06), transparent 40%)`
          }}
        />
        <motion.div 
          className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-purple-500/10 to-cyan-500/10"
          style={{ y: backgroundY }}
        />
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
        <div className="absolute top-40 right-32 w-1 h-1 bg-purple-400 rounded-full animate-ping" />
        <div className="absolute bottom-32 left-32 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
      </div>

      {/* Navigation with Scroll Spy */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div
              className="flex items-center space-x-3 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              onClick={() => scrollToSection('hero')}
            >
              <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-xl font-bold text-white">CN</span>
              </div>
              <span className="text-xl font-bold text-white">CodeNest</span>
            </motion.div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection('features')}
                className={`transition-colors ${
                  activeSection === 'features' 
                    ? 'text-blue-400' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Features
              </button>
              
              <button
                onClick={() => scrollToSection('faculty')}
                className={`transition-colors ${
                  activeSection === 'faculty' 
                    ? 'text-blue-400' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Faculty
              </button>
              <button
                onClick={() => scrollToSection('student')}
                className={`transition-colors ${
                  activeSection === 'student' 
                    ? 'text-blue-400' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Student
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className={`transition-colors ${
                  activeSection === 'contact' 
                    ? 'text-blue-400' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Contact
              </button>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <button
                  onClick={handleStartTrial}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition duration-200"
                >
                  Dashboard
                </button>
              ) : (
                <>
                  <Link to="/login">
                    <button className="px-6 py-2 text-gray-300 hover:text-white font-medium transition duration-200">
                      Sign In
                    </button>
                  </Link>
                  <Link to="/register">
                    <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition duration-200">
                      Get Started
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600 z-50"
        style={{ scaleX: scrollYProgress, transformOrigin: '0%' }}
      />

      {/* Floating Navigation Indicator */}
      <motion.div
        className="fixed top-1/2 right-6 transform -translate-y-1/2 z-40 hidden lg:block"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1 }}
      >
        <div className="flex flex-col space-y-4">
          {['hero', 'features', 'faculty', 'student', 'contact'].map((sectionId) => (
            <motion.button
              key={sectionId}
              onClick={() => scrollToSection(sectionId)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                activeSection === sectionId
                  ? 'bg-blue-400 scale-125'
                  : 'bg-white/30 hover:bg-white/50'
              }`}
              whileHover={{ scale: 1.2 }}
              title={sectionId.charAt(0).toUpperCase() + sectionId.slice(1)}
            />
          ))}
        </div>
      </motion.div>

      {/* Hero Section */}
      <section ref={heroRef} id="hero" className="relative z-10 flex items-center justify-center min-h-screen px-6">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full text-sm font-medium text-blue-300 border border-blue-500/30 mb-8">
              AI-Powered Code Analysis
            </span>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl font-extrabold leading-tight mb-8"
            {...fadeInUp}
            transition={{ ...fadeInUp.transition, delay: 0.3 }}
          >
            It's like{' '}
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
              Googling
            </span>
            <br />
            <span className="text-gray-300">Mid-Sentence</span>
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed"
            {...fadeInUp}
            transition={{ ...fadeInUp.transition, delay: 0.5 }}
          >
            CodeNest gives you the answers you didn't study for in every conversation,
            without you even having to ask. Advanced plagiarism detection for academic excellence.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
            {...fadeInUp}
            transition={{ ...fadeInUp.transition, delay: 0.7 }}
          >
            <motion.button
              onClick={handleStartTrial}
              className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="flex items-center space-x-2">
                <span>
                  {isAuthenticated ? 'Go to Dashboard' : 'Get Started for Free'}
                </span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </motion.button>

            <motion.button
              onClick={() => scrollToSection('features')}
              className="px-8 py-4 border-2 border-gray-600 rounded-xl text-lg font-semibold hover:border-gray-400 transition-all duration-300 hover:bg-white/5"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              View Features
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
          >
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <motion.button
              onClick={() => scrollToSection('features')}
              className="text-gray-400 hover:text-white transition-colors"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ChevronDown className="w-6 h-5" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} id="features" className="relative z-10 py-20 px-6 min-h-screen flex items-center">
        <div className="max-w-6xl mx-auto w-full">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Why Choose{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                CodeNest?
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
              Advanced features designed for modern academic integrity
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                         {features.map((feature, index) => (
               <motion.div
                 key={index}
                 className="group p-8 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-3xl border border-white/20 hover:border-blue-500/30 transition-all duration-300 hover:bg-gradient-to-br hover:from-blue-500/10 hover:to-purple-500/10 hover:shadow-2xl hover:shadow-blue-500/20"
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.6, delay: index * 0.1 }}
                 viewport={{ once: true }}
                 whileHover={{ y: -8, scale: 1.02 }}
               >
                 <div className="text-blue-400 mb-6 group-hover:scale-110 transition-transform duration-300 flex justify-center">
                   <div className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl border border-blue-500/30">
                     {feature.icon}
                   </div>
                 </div>
                 <h3 className="text-2xl font-bold mb-4 text-center">{feature.title}</h3>
                 <p className="text-gray-300 text-center leading-relaxed">{feature.description}</p>
               </motion.div>
             ))}
          </div>
        </div>
      </section>



      {/* Faculty Section */}
      <section ref={facultyRef} id="faculty" className="relative z-10 pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              For{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Educators
              </span>
            </h2>
            <p className="text-base text-gray-300 max-w-2xl mx-auto">
              Streamline your academic integrity workflow with powerful tools designed for institutions
            </p>
          </motion.div>

                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
             <motion.div
               initial={{ opacity: 0, x: -30 }}
               whileInView={{ opacity: 1, x: 0 }}
               transition={{ duration: 0.6 }}
               viewport={{ once: true }}
             >
               <h3 className="text-2xl font-bold mb-4">Why Choose Faculty Account?</h3>
               <div className="space-y-4">
                                 <div className="flex items-start space-x-3">
                   <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                     <Users className="w-5 h-5 text-blue-400" />
                   </div>
                   <div>
                     <h4 className="text-lg font-semibold mb-1">Batch Processing</h4>
                     <p className="text-gray-400 text-sm">Upload and analyze multiple projects simultaneously, saving hours of manual work.</p>
                   </div>
                 </div>
                 <div className="flex items-start space-x-3">
                   <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                     <BarChart3 className="w-5 h-5 text-purple-400" />
                   </div>
                   <div>
                     <h4 className="text-lg font-semibold mb-1">Advanced Analytics</h4>
                     <p className="text-gray-400 text-sm">Comprehensive reports with detailed insights and similarity scores.</p>
                   </div>
                 </div>
                 <div className="flex items-start space-x-3">
                   <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                     <Zap className="w-5 h-5 text-green-400" />
                   </div>
                   <div>
                     <h4 className="text-lg font-semibold mb-1">Lightning Fast</h4>
                     <p className="text-gray-400 text-sm">AI-powered analysis that processes projects in seconds, not minutes.</p>
                   </div>
                 </div>
              </div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
                             <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl p-6 border border-blue-500/30">
                 <div className="text-center mb-4">
                   <GraduationCap className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                   <h4 className="text-xl font-bold mb-2">How to Upload & Analyze</h4>
                   <p className="text-gray-300 text-sm">Simple 3-step process for academic integrity</p>
                 </div>
                 <div className="space-y-3">
                   <div className="flex items-center space-x-3 p-2 bg-white/5 rounded-lg">
                     <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">1</div>
                     <span className="text-gray-300 text-sm">Upload project files (ZIP, PDF, or code files)</span>
                   </div>
                   <div className="flex items-center space-x-3 p-2 bg-white/5 rounded-lg">
                     <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">2</div>
                     <span className="text-gray-300 text-sm">AI analyzes for plagiarism and similarity</span>
                   </div>
                   <div className="flex items-center space-x-3 p-2 bg-white/5 rounded-lg">
                     <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs">3</div>
                     <span className="text-gray-300 text-sm">Get detailed reports with actionable insights</span>
                   </div>
                 </div>
                 <div className="mt-4 pt-3 border-t border-white/10">
                   <div className="text-center">
                     <p className="text-gray-400 text-xs mb-2">Ready to get started?</p>
                     <button
                       onClick={handleStartTrial}
                       className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 text-sm"
                     >
                       Start Faculty Trial
                     </button>
                   </div>
                 </div>
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Student Section */}
      <section ref={studentRef} id="student" className="relative z-10 pt-16 pb-8 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
             <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              For{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Students
              </span>
            </h2>
            <p className="text-base text-gray-300 max-w-2xl mx-auto">
              Ensure your work is original and learn best practices for academic integrity
            </p>
          </motion.div>

                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <motion.div
              className="relative order-2 lg:order-1"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
                             <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30">
                 <div className="text-center mb-4">
                   <BookOpen className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                   <h4 className="text-xl font-bold mb-2">How to Check Your Work</h4>
                   <p className="text-gray-300 text-sm">Simple 3-step process for students</p>
                 </div>
                 <div className="space-y-3">
                   <div className="flex items-center space-x-3 p-2 bg-white/5 rounded-lg">
                     <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">1</div>
                     <span className="text-gray-300 text-sm">Upload your project file (ZIP, PDF, or code)</span>
                   </div>
                   <div className="flex items-center space-x-3 p-2 bg-white/5 rounded-lg">
                     <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xs">2</div>
                     <span className="text-gray-300 text-sm">AI scans for plagiarism and similarity</span>
                   </div>
                   <div className="flex items-center space-x-3 p-2 bg-white/5 rounded-lg">
                     <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs">3</div>
                     <span className="text-gray-300 text-sm">Get detailed report with improvement tips</span>
                   </div>
                 </div>
                 <div className="mt-4 pt-3 border-t border-white/10">
                   <div className="text-center">
                     <p className="text-gray-400 text-xs mb-2">Ready to check your work?</p>
                     <button
                       onClick={handleStartTrial}
                       className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg font-medium hover:from-purple-600 hover:to-pink-700 transition-all duration-300 text-sm"
                     >
                       Start Student Trial
                     </button>
                   </div>
                 </div>
               </div>
            </motion.div>

            <motion.div
              className="order-1 lg:order-2"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
                             <h3 className="text-2xl font-bold mb-4">Why Choose Student Account?</h3>
               <div className="space-y-4">
                                 <div className="flex items-start space-x-3">
                   <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                     <Check className="w-5 h-5 text-purple-400" />
                   </div>
                   <div>
                     <h4 className="text-lg font-semibold mb-1">Pre-Submission Check</h4>
                     <p className="text-gray-400 text-sm">Verify your work is original before submitting to avoid academic issues.</p>
                   </div>
                 </div>
                 <div className="flex items-start space-x-3">
                   <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                     <BarChart3 className="w-5 h-5 text-cyan-400" />
                   </div>
                   <div>
                     <h4 className="text-lg font-semibold mb-1">Progress Tracking</h4>
                     <p className="text-gray-400 text-sm">Monitor your improvement over time with detailed analytics.</p>
                   </div>
                 </div>
                 <div className="flex items-start space-x-3">
                   <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                     <Zap className="w-5 h-5 text-green-400" />
                   </div>
                   <div>
                     <h4 className="text-lg font-semibold mb-1">Instant Results</h4>
                     <p className="text-gray-400 text-sm">Get analysis results in seconds, not hours.</p>
                   </div>
                 </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section ref={contactRef} id="contact" className="relative z-10 pt-16 pb-8 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
             <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Get in{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Touch
              </span>
            </h2>
            <p className="text-base text-gray-300 max-w-2xl mx-auto">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </motion.div>

                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
                             <h3 className="text-xl font-bold mb-4">Contact Information</h3>
               <div className="space-y-4">
                                 <div className="flex items-center space-x-3">
                   <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                     <Mail className="w-5 h-5 text-blue-400" />
                   </div>
                   <div>
                     <h4 className="font-semibold text-sm">Email</h4>
                     <p className="text-gray-400 text-sm">gajjarmahi40@gmail.com</p>
                   </div>
                 </div>
                 <div className="flex items-center space-x-3">
                   <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                     <Phone className="w-5 h-5 text-purple-400" />
                   </div>
                   <div>
                     <h4 className="font-semibold text-sm">Phone</h4>
                     <p className="text-gray-400 text-sm">+91 9054590252</p>
                   </div>
                 </div>
                 <div className="flex items-center space-x-3">
                   <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                     <MapPin className="w-5 h-5 text-cyan-400" />
                   </div>
                   <div>
                     <h4 className="font-semibold text-sm">Address</h4>
                     <p className="text-gray-400 text-sm"> LJ Campus, LJ University Rd, off Sarkhej - Gandhinagar Highway, Makarba, Ahmedabad, Sarkhej-Okaf, Gujarat 382210</p>
                   </div>
                 </div>
              </div>

              <div className="mt-6">
                <h4 className="font-semibold mb-3 text-sm">Follow Us</h4>
                <div className="flex space-x-4">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                    <span className="text-lg"><a href="https://twitter.com/codenest" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                                 <Twitter className="w-5 h-5" />
                             </a>
                             </span>
                  </div>
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                    <span className="text-lg"><a href="https://facebook.com/codenest" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                                 <Facebook className="w-5 h-5" />
                             </a>
                             </span>
                  </div>
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                    <span className="text-lg"><a href="https://linkedin.com/company/codenest" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                    <Linkedin className="w-5 h-5" /></a></span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">First Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Last Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Subject</label>
                  <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 transition-colors">
                    <option>General Inquiry</option>
                    <option>Sales Question</option>
                    <option>Technical Support</option>
                    <option>Partnership</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    placeholder="Tell us how we can help..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
                >
                  Send Message
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative z-10 pt-16 pb-8 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Transform
              </span>{' '}
              Your Workflow?
            </h2>
            <p className="text-base text-gray-300 mb-6">
              Join thousands of educators and students who trust CodeNest for academic integrity.
            </p>
            
                         <motion.button
               onClick={handleStartTrial}
               className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25"
               whileHover={{ scale: 1.05, y: -2 }}
               whileTap={{ scale: 0.95 }}
             >
              <span className="flex items-center space-x-2">
                <span>
                  {isAuthenticated 
                    ? `Continue as ${user?.role}` 
                    : 'Start Your Free Trial'
                  }
                </span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Back to Top Button */}
      <motion.button
        onClick={() => scrollToSection('hero')}
        className="fixed bottom-8 right-8 z-40 p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:scale-110"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.5 }}
        whileHover={{ y: -2 }}
      >
        <ChevronDown className="w-6 h-6 text-white rotate-180" />
      </motion.button>
    </div>
  );
};

export default Landing;