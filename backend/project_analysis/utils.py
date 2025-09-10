import os
import re
import json
import ast
import xml.etree.ElementTree as ET
import tempfile
import zipfile
import shutil
from pathlib import Path
from collections import Counter, defaultdict
from .models import StudentProject, ProjectSummary

# Enhanced tech stack detection
def detect_tech_stack_enhanced(project_path):
    """Enhanced tech stack detection with dependency file analysis"""
    tech_stack = set()
    confidence_scores = defaultdict(int)
    
    # File extension analysis
    file_indicators = {
        'Python': ['.py'],
        'JavaScript': ['.js', '.mjs'],
        'TypeScript': ['.ts', '.tsx'],
        'React': ['.jsx', '.tsx'],
        'Vue.js': ['.vue'],
        'HTML': ['.html', '.htm'],
        'CSS': ['.css', '.scss', '.sass', '.less'],
        'PHP': ['.php'],
        'Java': ['.java'],
        'C++': ['.cpp', '.cc', '.cxx'],
        'C': ['.c', '.h'],
        'C#': ['.cs'],
        'Ruby': ['.rb'],
        'Go': ['.go'],
        'Rust': ['.rs'],
        'Swift': ['.swift'],
        'Kotlin': ['.kt'],
    }
    
    # Framework-specific files
    framework_files = {
        'React': ['package.json', '.jsx', 'src/App.jsx', 'public/index.html'],
        'Vue.js': ['package.json', '.vue', 'vue.config.js'],
        'Angular': ['angular.json', 'package.json', '.ts'],
        'Django': ['manage.py', 'settings.py', 'urls.py', 'models.py'],
        'Flask': ['app.py', '__init__.py', 'requirements.txt'],
        'Express.js': ['package.json', 'server.js', 'app.js'],
        'Next.js': ['next.config.js', 'package.json'],
        'Laravel': ['composer.json', 'artisan', '.env.example'],
        'Spring Boot': ['pom.xml', 'application.properties'],
        'ASP.NET': ['*.csproj', 'appsettings.json'],
    }
    
    # Scan all files
    all_files = []
    for root, dirs, files in os.walk(project_path):
        dirs[:] = [d for d in dirs if d not in {'.git', '__pycache__', 'node_modules', '.vscode', 'build', 'dist'}]
        for file in files:
            file_path = os.path.join(root, file)
            all_files.append((file, file_path))
    
    # Basic file extension analysis
    for file, file_path in all_files:
        for tech, extensions in file_indicators.items():
            if any(file.lower().endswith(ext) for ext in extensions):
                tech_stack.add(tech)
                confidence_scores[tech] += 1
    
    # Framework detection by specific files
    for framework, indicators in framework_files.items():
        found_indicators = 0
        for indicator in indicators:
            if indicator.startswith('.'):  # Extension
                if any(f[0].endswith(indicator) for f in all_files):
                    found_indicators += 1
            else:  # Specific file
                if any(indicator in f for f in all_files):
                    found_indicators += 1
        
        if found_indicators >= 2:  # Need at least 2 indicators
            tech_stack.add(framework)
            confidence_scores[framework] += found_indicators * 2
    
    # Dependency file analysis
    dependency_analysis = analyze_dependency_files(project_path, all_files)
    tech_stack.update(dependency_analysis['frameworks'])
    
    # Content-based detection
    content_analysis = analyze_file_contents(all_files)
    tech_stack.update(content_analysis['frameworks'])
    
    return {
        'tech_stack': sorted(list(tech_stack)),
        'confidence_scores': dict(confidence_scores),
        'details': {
            'dependency_analysis': dependency_analysis,
            'content_analysis': content_analysis
        }
    }

def analyze_dependency_files(project_path, all_files):
    """Analyze dependency files for accurate tech stack detection"""
    frameworks = set()
    libraries = []
    
    # package.json analysis
    for file, file_path in all_files:
        if file == 'package.json':
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    package_data = json.load(f)
                    
                    # Extract dependencies
                    all_deps = {}
                    all_deps.update(package_data.get('dependencies', {}))
                    all_deps.update(package_data.get('devDependencies', {}))
                    
                    libraries.extend(all_deps.keys())
                    
                    # Framework detection from dependencies
                    if 'react' in all_deps:
                        frameworks.add('React')
                    if 'vue' in all_deps:
                        frameworks.add('Vue.js')
                    if '@angular/core' in all_deps:
                        frameworks.add('Angular')
                    if 'express' in all_deps:
                        frameworks.add('Express.js')
                    if 'next' in all_deps:
                        frameworks.add('Next.js')
                    if 'nuxt' in all_deps:
                        frameworks.add('Nuxt.js')
                    if 'svelte' in all_deps:
                        frameworks.add('Svelte')
                        
            except Exception as e:
                print(f"Error parsing package.json: {e}")
    
    # requirements.txt analysis
    for file, file_path in all_files:
        if file == 'requirements.txt':
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#'):
                            lib_name = re.split(r'[>=<]', line)[0].strip()
                            libraries.append(lib_name)
                            
                            # Framework detection from requirements
                            if lib_name.lower() in ['django']:
                                frameworks.add('Django')
                            elif lib_name.lower() in ['flask']:
                                frameworks.add('Flask')
                            elif lib_name.lower() in ['fastapi']:
                                frameworks.add('FastAPI')
                            elif lib_name.lower() in ['tornado']:
                                frameworks.add('Tornado')
                                
            except Exception as e:
                print(f"Error parsing requirements.txt: {e}")
    
    # pom.xml analysis (Maven)
    for file, file_path in all_files:
        if file == 'pom.xml':
            try:
                tree = ET.parse(file_path)
                root = tree.getroot()
                
                # Extract dependencies
                for dependency in root.findall('.//{http://maven.apache.org/POM/4.0.0}dependency'):
                    artifact_id = dependency.find('{http://maven.apache.org/POM/4.0.0}artifactId')
                    if artifact_id is not None:
                        lib_name = artifact_id.text
                        libraries.append(lib_name)
                        
                        # Framework detection
                        if 'spring-boot' in lib_name:
                            frameworks.add('Spring Boot')
                        elif 'spring' in lib_name:
                            frameworks.add('Spring Framework')
                            
            except Exception as e:
                print(f"Error parsing pom.xml: {e}")
    
    # Composer.json analysis (PHP)
    for file, file_path in all_files:
        if file == 'composer.json':
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    composer_data = json.load(f)
                    
                    require = composer_data.get('require', {})
                    require_dev = composer_data.get('require-dev', {})
                    
                    all_deps = {**require, **require_dev}
                    libraries.extend(all_deps.keys())
                    
                    # Framework detection
                    if 'laravel/framework' in all_deps:
                        frameworks.add('Laravel')
                    elif 'symfony/framework-bundle' in all_deps:
                        frameworks.add('Symfony')
                        
            except Exception as e:
                print(f"Error parsing composer.json: {e}")
    
    return {
        'frameworks': frameworks,
        'libraries': list(set(libraries))
    }

def analyze_file_contents(all_files):
    """Analyze file contents for framework-specific patterns"""
    frameworks = set()
    patterns = {
        'React': [r'import\s+React', r'from\s+[\'"]react[\'"]', r'useState', r'useEffect'],
        'Vue.js': [r'new\s+Vue\(', r'<template>', r'{{.*}}', r'@click'],
        'Angular': [r'@Component', r'@Injectable', r'ngOnInit'],
        'jQuery': [r'\$\(', r'jQuery\('],
        'Bootstrap': [r'class=[\'"].*btn.*[\'"]', r'container-fluid'],
        'Tailwind CSS': [r'class=[\'"].*flex.*[\'"]', r'bg-\w+', r'text-\w+'],
        'Django': [r'from\s+django', r'models\.Model', r'render\(request'],
        'Flask': [r'from\s+flask', r'@app\.route', r'Flask\(__name__\)'],
        'Express.js': [r'express\(\)', r'app\.get\(', r'app\.listen\('],
    }
    
    for file, file_path in all_files:
        if any(file.endswith(ext) for ext in ['.py', '.js', '.jsx', '.ts', '.tsx', '.vue', '.html', '.css']):
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    
                    for framework, pattern_list in patterns.items():
                        for pattern in pattern_list:
                            if re.search(pattern, content, re.IGNORECASE):
                                frameworks.add(framework)
                                break
                                
            except Exception as e:
                continue
    
    return {'frameworks': frameworks}

def extract_libraries_enhanced(project_path):
    """Enhanced library extraction from multiple sources"""
    libraries = set()
    
    print(f"Extracting libraries from: {project_path}")
    
    try:
        # Method 1: From package.json
        for root, dirs, files in os.walk(project_path):
            dirs[:] = [d for d in dirs if d not in {'.git', '__pycache__', 'node_modules'}]
            
            if 'package.json' in files:
                package_json_path = os.path.join(root, 'package.json')
                print(f"Found package.json at: {package_json_path}")
                
                try:
                    with open(package_json_path, 'r', encoding='utf-8') as f:
                        package_data = json.load(f)
                        
                        # Extract dependencies
                        deps = package_data.get('dependencies', {})
                        dev_deps = package_data.get('devDependencies', {})
                        
                        for lib in deps.keys():
                            libraries.add(lib)
                        for lib in dev_deps.keys():
                            libraries.add(lib)
                        
                        print(f"Found {len(deps)} dependencies and {len(dev_deps)} devDependencies")
                        
                except Exception as e:
                    print(f"Error reading package.json: {e}")
        
        # Method 2: From requirements.txt
        for root, dirs, files in os.walk(project_path):
            if 'requirements.txt' in files:
                req_path = os.path.join(root, 'requirements.txt')
                print(f"Found requirements.txt at: {req_path}")
                
                try:
                    with open(req_path, 'r', encoding='utf-8') as f:
                        for line in f:
                            line = line.strip()
                            if line and not line.startswith('#'):
                                # Extract package name (before version specifiers)
                                lib_name = re.split(r'[>=<]', line)[0].strip()
                                libraries.add(lib_name)
                                
                except Exception as e:
                    print(f"Error reading requirements.txt: {e}")
        
        # Method 3: Scan code files for imports
        code_libs = extract_libraries_from_imports(project_path)
        libraries.update(code_libs)
        
        print(f"Total libraries found: {len(libraries)}")
        
    except Exception as e:
        print(f"Error in library extraction: {e}")
    
    return sorted(list(libraries)) if libraries else []

def extract_libraries_from_imports(project_path):
    """Extract libraries from import statements in code files"""
    libraries = set()
    
    # JavaScript/TypeScript import patterns
    js_patterns = [
        r'import\s+.*\s+from\s+[\'"]([^\'"]+)[\'"]',  # import ... from 'lib'
        r'import\s+[\'"]([^\'"]+)[\'"]',              # import 'lib'
        r'require\([\'"]([^\'"]+)[\'"]\)',           # require('lib')
    ]
    
    # Python import patterns  
    py_patterns = [
        r'import\s+(\w+)',                           # import lib
        r'from\s+(\w+)\s+import',                    # from lib import ...
    ]
    
    try:
        for root, dirs, files in os.walk(project_path):
            dirs[:] = [d for d in dirs if d not in {'.git', '__pycache__', 'node_modules'}]
            
            for file in files:
                file_path = os.path.join(root, file)
                file_ext = os.path.splitext(file)[1].lower()
                
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        
                        if file_ext in {'.js', '.jsx', '.ts', '.tsx'}:
                            # Process JavaScript/TypeScript files
                            for pattern in js_patterns:
                                matches = re.findall(pattern, content)
                                for match in matches:
                                    # Extract package name (before first '/')
                                    package = match.split('/')[0]
                                    if not package.startswith('.'):  # Skip relative imports
                                        libraries.add(package)
                        
                        elif file_ext == '.py':
                            # Process Python files
                            for pattern in py_patterns:
                                matches = re.findall(pattern, content)
                                for match in matches:
                                    libraries.add(match)
                                    
                except Exception:
                    continue
    
    except Exception as e:
        print(f"Error scanning imports: {e}")
    
    return libraries


def extract_python_imports(file_path):
    """Extract Python imports using AST"""
    imports = set()
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            
        tree = ast.parse(content)
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    root_module = alias.name.split('.')[0]
                    imports.add(root_module)
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    root_module = node.module.split('.')
                    imports.add(root_module)
                    
    except Exception:
        pass
    
    return imports

def extract_js_imports(file_path):
    """Extract JavaScript/TypeScript imports"""
    imports = set()
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            
        # Extract ES6 imports
        import_patterns = [
            r'import\s+.*\s+from\s+[\'"]([^\'"]+)[\'"]',
            r'import\s+[\'"]([^\'"]+)[\'"]',
            r'require\([\'"]([^\'"]+)[\'"]\)',
        ]
        
        for pattern in import_patterns:
            matches = re.findall(pattern, content)
            for match in matches:
                # Extract package name (before first '/')
                package = match.split('/')[0]
                if not package.startswith('.'):  # Skip relative imports
                    imports.add(package)
                    
    except Exception:
        pass
    
    return imports

def detect_project_features_enhanced(project_path):
    """Enhanced feature detection with better pattern matching"""
    features = set()
    
    # Define comprehensive feature patterns
    feature_patterns = {
        'User Authentication': [
            r'login', r'register', r'signin', r'signup', r'auth', r'password',
            r'jwt', r'session', r'cookie', r'token', r'bcrypt'
        ],
        'Database Integration': [
            r'database', r'db', r'sql', r'mysql', r'postgresql', r'sqlite',
            r'mongodb', r'orm', r'model', r'schema', r'query'
        ],
        'REST API': [
            r'api', r'rest', r'endpoint', r'json', r'ajax', r'fetch',
            r'axios', r'request', r'response', r'http'
        ],
        'Real-time Features': [
            r'websocket', r'socket\.io', r'realtime', r'live', r'streaming',
            r'notification', r'push'
        ],
        'File Upload/Download': [
            r'upload', r'download', r'file', r'multipart', r'storage',
            r'attachment', r'media'
        ],
        'Search & Filtering': [
            r'search', r'filter', r'query', r'pagination', r'sort',
            r'elastic', r'lucene'
        ],
        'Admin Dashboard': [
            r'admin', r'dashboard', r'management', r'panel', r'control',
            r'statistics', r'analytics'
        ],
        'E-commerce Features': [
            r'cart', r'shopping', r'payment', r'order', r'product',
            r'checkout', r'stripe', r'paypal'
        ],
        'Social Features': [
            r'comment', r'like', r'follow', r'friend', r'share',
            r'social', r'profile', r'feed'
        ],
        'Email Integration': [
            r'email', r'mail', r'smtp', r'sendgrid', r'mailgun',
            r'newsletter', r'notification'
        ],
        'Security Features': [
            r'csrf', r'xss', r'security', r'encryption', r'hash',
            r'sanitize', r'validate', r'firewall'
        ],
        'Responsive Design': [
            r'responsive', r'mobile', r'media\s*query', r'bootstrap',
            r'flexbox', r'grid', r'tailwind'
        ]
    }
    
    # Collect all content
    all_content = ""
    for root, dirs, files in os.walk(project_path):
        dirs[:] = [d for d in dirs if d not in {'.git', '__pycache__', 'node_modules'}]
        for file in files:
            if any(file.lower().endswith(ext) for ext in ['.py', '.js', '.jsx', '.html', '.css', '.md', '.txt', '.vue', '.ts']):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        all_content += f.read().lower() + " "
                except:
                    continue
    
    # Check for features
    for feature, patterns in feature_patterns.items():
        matches = 0
        for pattern in patterns:
            if re.search(pattern, all_content, re.IGNORECASE):
                matches += 1
        
        # Require at least 2 pattern matches for confidence
        if matches >= 2:
            features.add(feature)
    
    return sorted(list(features))

def get_file_statistics(project_path):
    """Get detailed file statistics with proper error handling"""
    stats = {
        'total_files': 0,
        'code_files': 0,
        'total_size_mb': 0.0,
        'largest_files': []
    }
    
    code_extensions = {'.py', '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.php', '.java', '.cpp', '.c'}
    file_sizes = []
    total_size_bytes = 0
    
    print(f"Calculating file statistics for: {project_path}")
    
    try:
        if not os.path.exists(project_path):
            print(f"Project path does not exist: {project_path}")
            return stats
            
        for root, dirs, files in os.walk(project_path):
            # Skip hidden directories
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in {'__pycache__', 'node_modules'}]
            
            for file in files:
                if file.startswith('.'):  # Skip hidden files
                    continue
                    
                file_path = os.path.join(root, file)
                
                try:
                    if os.path.isfile(file_path):
                        file_size = os.path.getsize(file_path)
                        file_ext = os.path.splitext(file)[1].lower()
                        
                        stats['total_files'] += 1
                        total_size_bytes += file_size
                        
                        # Count code files
                        if file_ext in code_extensions:
                            stats['code_files'] += 1
                        
                        # Store file sizes for largest files calculation
                        file_sizes.append((file, file_size))
                        
                except (OSError, IOError) as e:
                    print(f"Error accessing file {file_path}: {e}")
                    continue
        
        # Convert to MB
        stats['total_size_mb'] = round(total_size_bytes / (1024 * 1024), 2)
        
        # Get largest files
        file_sizes.sort(key=lambda x: x[1], reverse=True)
        stats['largest_files'] = [
            {'name': name, 'size_kb': round(size/1024, 2)} 
            for name, size in file_sizes[:3]  # Top 3 files
        ]
        
        print(f"File stats calculated: {stats['total_files']} files, {stats['code_files']} code files, {stats['total_size_mb']} MB")
        
    except Exception as e:
        print(f"Error calculating file statistics: {e}")
        import traceback
        traceback.print_exc()
    
    return stats

# Enhanced extraction function
def extract_student_project_zip(zip_path, extract_to):
    """Extract a single student project ZIP file - handles any structure"""
    print(f"Extracting student project ZIP: {zip_path}")
    
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            # Extract everything to temp location
            temp_extract = os.path.join(extract_to, 'temp_student_project')
            os.makedirs(temp_extract, exist_ok=True)
            zip_ref.extractall(temp_extract)
            
            # Look for ANY code files anywhere in the extracted content
            project_name = find_project_with_code(temp_extract, extract_to)
            
            if project_name:
                print(f"Successfully extracted student project: {project_name}")
                return project_name
            else:
                print("No valid project files found in the ZIP")
                shutil.rmtree(temp_extract, ignore_errors=True)
                return None
                
    except Exception as e:
        print(f"Error extracting student project: {e}")
        return None

def find_project_with_code(temp_extract, final_extract_to):
    """Find and move the folder that contains code files"""
    code_extensions = {'.py', '.js', '.jsx', '.html', '.css', '.php', '.java', '.cpp', '.c', '.ts', '.tsx'}
    
    # Function to check if directory has code files
    def has_code_files(directory):
        for root, dirs, files in os.walk(directory):
            for file in files:
                if any(file.lower().endswith(ext) for ext in code_extensions):
                    return True
        return False
    
    # Check if temp_extract itself has code files
    if has_code_files(temp_extract):
        project_name = 'student_project'
        final_path = os.path.join(final_extract_to, project_name)
        
        # Remove existing if any
        if os.path.exists(final_path):
            shutil.rmtree(final_path, ignore_errors=True)
        
        # Move the entire temp directory
        shutil.move(temp_extract, final_path)
        return project_name
    
    # Check subdirectories
    try:
        for item in os.listdir(temp_extract):
            item_path = os.path.join(temp_extract, item)
            if os.path.isdir(item_path) and has_code_files(item_path):
                project_name = item
                final_path = os.path.join(final_extract_to, project_name)
                
                # Remove existing if any
                if os.path.exists(final_path):
                    shutil.rmtree(final_path, ignore_errors=True)
                
                # Move the project directory
                shutil.move(item_path, final_path)
                
                # Clean up temp
                shutil.rmtree(temp_extract, ignore_errors=True)
                return project_name
    except Exception as e:
        print(f"Error scanning subdirectories: {e}")
    
    return None

def analyze_student_project(project_path, student, project_name):
    """Complete enhanced analysis of a student project - DEBUG VERSION"""
    print(f"=== STARTING ANALYSIS FOR: {project_name} ===")
    print(f"Project path: {project_path}")
    
    project = StudentProject.objects.create(
        student=student,
        project_name=project_name,
        file_path=project_path
    )
    
    # Enhanced analysis with debug
    print("=== DETECTING TECH STACK ===")
    tech_stack_result = detect_tech_stack_enhanced(project_path)
    print(f"Tech stack found: {tech_stack_result['tech_stack']}")
    
    print("=== EXTRACTING LIBRARIES ===")
    libraries = extract_libraries_debug(project_path)  # Use debug version
    
    print("=== DETECTING FEATURES ===")
    features = detect_project_features_enhanced(project_path)
    print(f"Features found: {features}")
    
    print("=== CALCULATING FILE STATISTICS ===")
    file_stats = get_file_statistics(project_path)
    print(f"File stats: {file_stats}")
    
    # Create summary
    summary = ProjectSummary.objects.create(
        project=project,
        tech_stack=tech_stack_result['tech_stack'],
        libraries=libraries,
        features=features,
        file_stats=file_stats
    )
    
    print("=== ANALYSIS COMPLETE ===")
    
    return {
        'project_id': project.id,
        'tech_stack': tech_stack_result['tech_stack'],
        'tech_stack_confidence': tech_stack_result['confidence_scores'],
        'libraries': libraries,
        'features': features,
        'file_stats': file_stats,
        'analysis_details': tech_stack_result['details']
    }


def extract_libraries_debug(project_path):
    """Debug version with detailed logging"""
    libraries = set()
    
    print(f"DEBUG: Starting library extraction from: {project_path}")
    
    try:
        # Check if directory exists
        if not os.path.exists(project_path):
            print(f"DEBUG: Project path does not exist: {project_path}")
            return []
        
        # List all files in project
        all_files = []
        for root, dirs, files in os.walk(project_path):
            dirs[:] = [d for d in dirs if not d.startswith('.')]
            for file in files:
                all_files.append(os.path.join(root, file))
        
        print(f"DEBUG: Found {len(all_files)} files in project")
        
        # Look for package.json
        package_json_found = False
        for file_path in all_files:
            if file_path.endswith('package.json'):
                package_json_found = True
                print(f"DEBUG: Found package.json at: {file_path}")
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        deps = data.get('dependencies', {})
                        dev_deps = data.get('devDependencies', {})
                        
                        print(f"DEBUG: Found {len(deps)} dependencies: {list(deps.keys())}")
                        print(f"DEBUG: Found {len(dev_deps)} devDependencies: {list(dev_deps.keys())}")
                        
                        for lib in deps.keys():
                            libraries.add(lib)
                        for lib in dev_deps.keys():
                            libraries.add(lib)
                            
                except Exception as e:
                    print(f"DEBUG: Error parsing package.json: {e}")
                break
        
        if not package_json_found:
            print("DEBUG: No package.json found in project")
        
        # Look for requirements.txt
        requirements_found = False
        for file_path in all_files:
            if file_path.endswith('requirements.txt'):
                requirements_found = True
                print(f"DEBUG: Found requirements.txt at: {file_path}")
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        lines = f.readlines()
                        print(f"DEBUG: requirements.txt has {len(lines)} lines")
                        
                        for line in lines:
                            line = line.strip()
                            if line and not line.startswith('#'):
                                lib_name = re.split(r'[>=<]', line)[0].strip()
                                libraries.add(lib_name)
                                print(f"DEBUG: Added library: {lib_name}")
                                
                except Exception as e:
                    print(f"DEBUG: Error parsing requirements.txt: {e}")
                break
        
        if not requirements_found:
            print("DEBUG: No requirements.txt found in project")
        
        # If no dependency files, scan import statements
        if not libraries:
            print("DEBUG: No dependency files found, scanning import statements...")
            
            import_libs = extract_libraries_from_imports(project_path)
            libraries.update(import_libs)
            print(f"DEBUG: Found {len(import_libs)} libraries from imports")
        
        final_libs = sorted(list(libraries))
        print(f"DEBUG: Final library list ({len(final_libs)}): {final_libs}")
        
    except Exception as e:
        print(f"DEBUG: Error in library extraction: {e}")
        import traceback
        traceback.print_exc()
    
    return sorted(list(libraries)) if libraries else []
