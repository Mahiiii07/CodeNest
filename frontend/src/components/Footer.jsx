import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Facebook, Linkedin, Mail, MapPin, Phone } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-t border-white/10 text-white">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand Section */}
                    <div className="col-span-1">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                                <span className="text-xl font-bold text-white">CN</span>
                            </div>
                            <span className="text-xl font-bold text-white">CodeNest</span>
                        </div>
                        <p className="text-gray-300 mb-4">
                            Advanced plagiarism detection powered by AI. Ensuring academic integrity for the future.
                        </p>
                                                 <div className="flex space-x-4">
                             <a href="https://twitter.com/codenest" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                                 <Twitter className="w-5 h-5" />
                             </a>
                             <a href="https://facebook.com/codenest" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                                 <Facebook className="w-5 h-5" />
                             </a>
                             <a href="https://linkedin.com/company/codenest" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                                 <Linkedin className="w-5 h-5" />
                             </a>
                         </div>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h3 className="font-bold text-white mb-4">Product</h3>
                        <ul className="space-y-2">
                            <li><Link to="/features" className="text-gray-300 hover:text-white transition-colors">Features</Link></li>
                            
                            <li><Link to="/faculty-dashboard" className="text-gray-300 hover:text-white transition-colors">Faculty Dashboard</Link></li>
                            <li><Link to="/student-dashboard" className="text-gray-300 hover:text-white transition-colors">Student Dashboard</Link></li>
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h3 className="font-bold text-white mb-4">Company</h3>
                        <ul className="space-y-2">
                            <li><Link to="/blog" className="text-gray-300 hover:text-white transition-colors">Blog</Link></li>
                            <li><Link to="/contact" className="text-gray-300 hover:text-white transition-colors">Contact</Link></li> 
                        </ul>
                    </div>


                    {/* Contact Info */}
                    <div>
                        <h3 className="font-bold text-white mb-4">Contact</h3>
                        <ul className="space-y-3">
                            <li className="flex items-center text-gray-300">
                                <Mail className="w-4 h-4 mr-2" />
                                gajjarmahi40@gmail.com
                            </li>
                            <li className="flex items-center text-gray-300">
                                <Phone className="w-4 h-4 mr-2" />
                                +91 9054590252
                            </li>
                            <li className="flex items-start text-gray-300">
                                <MapPin className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
                                LJ Campus, LJ University Rd, off Sarkhej - Gandhinagar Highway, Makarba, Ahmedabad, Sarkhej-Okaf, Gujarat 382210
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
                    <div className="text-gray-400 text-sm mb-4 md:mb-0">
                        2025 CodeNest. All rights reserved.
                    </div>
                    <div className="flex space-x-6 text-sm">
                        <a href="#privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
                        <a href="#cookies" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;