import os
import zipfile
import tempfile
import shutil
import hashlib
import ast
import difflib
import numpy as np
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def extract_batch_zip_file(zip_path, extract_to):
    """Extract ZIP file containing multiple student projects (for faculty batch uploads)"""
    extracted_projects = []
    
    print(f"📦 Extracting batch ZIP: {zip_path}")
    
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            # First, extract everything to a temporary location
            temp_extract = os.path.join(extract_to, 'temp_extract')
            os.makedirs(temp_extract, exist_ok=True)
            zip_ref.extractall(temp_extract)
            
            # Now check what we extracted
            for root, dirs, files in os.walk(temp_extract):
                for file in files:
                    if file.endswith('.zip'):
                        # Found a nested ZIP file - this is likely a student project
                        nested_zip_path = os.path.join(root, file)
                        student_name = os.path.splitext(file)[0]  # Use filename as student ID
                        
                        # Create extraction directory for this student
                        student_extract_dir = os.path.join(extract_to, student_name)
                        os.makedirs(student_extract_dir, exist_ok=True)
                        
                        print(f"  👨‍🎓 Extracting student project: {file} -> {student_extract_dir}")
                        
                        try:
                            with zipfile.ZipFile(nested_zip_path, 'r') as student_zip:
                                student_zip.extractall(student_extract_dir)
                            extracted_projects.append(student_name)
                            print(f"    ✅ Successfully extracted {student_name}")
                        except Exception as e:
                            print(f"    ❌ Error extracting {file}: {e}")
                            continue
                
                # Also check for direct folders (if ZIP contains folders instead of nested ZIPs)
                for dir_name in dirs:
                    dir_path = os.path.join(root, dir_name)
                    # Check if this directory contains project files
                    if has_project_files(dir_path):
                        # Copy this directory as a project
                        student_extract_dir = os.path.join(extract_to, dir_name)
                        if not os.path.exists(student_extract_dir):
                            shutil.copytree(dir_path, student_extract_dir)
                            extracted_projects.append(dir_name)
                            print(f"  📁 Found direct folder: {dir_name}")
            
            # Clean up temporary extraction
            shutil.rmtree(temp_extract, ignore_errors=True)
            
    except zipfile.BadZipFile:
        print(f"❌ Error: {zip_path} is not a valid ZIP file")
        return []
    except Exception as e:
        print(f"❌ Error extracting ZIP file: {e}")
        return []
    
    print(f"✅ Successfully extracted {len(extracted_projects)} projects: {extracted_projects}")
    return extracted_projects


def has_project_files(directory):
    """Check if directory contains project files"""
    code_extensions = {'.py', '.js', '.jsx', '.html', '.css', '.php', '.java', '.cpp', '.c', '.ts', '.tsx'}
    
    try:
        for root, dirs, files in os.walk(directory):
            for file in files:
                if any(file.lower().endswith(ext) for ext in code_extensions):
                    return True
    except Exception:
        pass
    
    return False


def extract_code_features_enhanced(project_path):
    """Enhanced feature extraction with AST analysis and better parsing"""
    print(f"🔍 Extracting features from: {project_path}")
    
    features = {
        'total_files': 0,
        'python_files': 0,
        'js_files': 0,
        'html_files': 0,
        'css_files': 0,
        'total_lines': 0,
        'code_lines': 0,
        'comment_lines': 0,
        'blank_lines': 0,
        'functions_count': 0,
        'classes_count': 0,
        'imports': [],
        'keywords': [],
        'file_hashes': [],
        'ast_structures': [],
        'text_content': '',
        'function_names': [],
        'variable_names': [],
        'comments': [],
        'string_literals': [],
        'control_flow_patterns': [],
        'code_tokens': []  # Add this for TF-IDF
    }
    
    code_extensions = {'.py', '.js', '.jsx', '.html', '.css', '.php', '.java', '.cpp', '.c', '.ts', '.tsx'}
    
    try:
        for root, dirs, files in os.walk(project_path):
            # Skip common non-project directories
            dirs[:] = [d for d in dirs if d not in {'.git', '__pycache__', 'node_modules', '.vscode', '.idea'}]
            
            for file in files:
                file_path = os.path.join(root, file)
                file_ext = os.path.splitext(file)[1].lower()
                
                features['total_files'] += 1
                
                if file_ext in code_extensions:
                    try:
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()
                            features['text_content'] += content + '\n'
                            
                            # Tokenize content for TF-IDF
                            tokens = re.findall(r'\b\w+\b', content.lower())
                            features['code_tokens'].extend(tokens)
                            
                            lines = content.split('\n')
                            features['total_lines'] += len(lines)
                            
                            # Analyze lines
                            for line in lines:
                                stripped = line.strip()
                                if not stripped:
                                    features['blank_lines'] += 1
                                elif stripped.startswith(('#', '//', '/*')) or '/*' in stripped:
                                    features['comment_lines'] += 1
                                    features['comments'].append(stripped[:100])  # Limit length
                                else:
                                    features['code_lines'] += 1
                            
                            # File-specific analysis
                            if file_ext == '.py':
                                features['python_files'] += 1
                                py_features = extract_python_features_enhanced(content)
                                merge_features(features, py_features)
                                        
                            elif file_ext in {'.js', '.jsx', '.ts', '.tsx'}:
                                features['js_files'] += 1
                                js_features = extract_js_features_enhanced(content)
                                merge_features(features, js_features)
                                        
                            elif file_ext == '.html':
                                features['html_files'] += 1
                            elif file_ext == '.css':
                                features['css_files'] += 1
                            
                            # Calculate file hash for exact duplicate detection
                            file_hash = hashlib.md5(content.encode()).hexdigest()
                            features['file_hashes'].append(file_hash)
                            
                    except Exception as e:
                        print(f"  ⚠️ Error processing {file_path}: {e}")
                        continue
    
    except Exception as e:
        print(f"❌ Error extracting features from {project_path}: {e}")
    
    print(f"  📊 Extracted: {features['total_files']} files, {features['code_lines']} code lines, {len(features['file_hashes'])} hashes")
    return features


def merge_features(target_features, source_features):
    """Merge source features into target features"""
    for key, value in source_features.items():
        if isinstance(value, list):
            target_features[key].extend(value)
        elif isinstance(value, (int, float)):
            target_features[key] += value


def extract_python_features_enhanced(code):
    """Enhanced Python feature extraction with AST analysis"""
    features = {
        'functions_count': 0,
        'classes_count': 0,
        'imports': [],
        'keywords': [],
        'function_names': [],
        'variable_names': [],
        'string_literals': [],
        'control_flow_patterns': [],
        'ast_structures': []
    }
    
    try:
        tree = ast.parse(code)
        
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                features['functions_count'] += 1
                features['function_names'].append(node.name)
                features['control_flow_patterns'].append('function_def')
                
            elif isinstance(node, ast.ClassDef):
                features['classes_count'] += 1
                features['control_flow_patterns'].append('class_def')
                
            elif isinstance(node, ast.Import):
                for alias in node.names:
                    features['imports'].append(alias.name)
                    
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    for alias in node.names:
                        features['imports'].append(f"{node.module}.{alias.name}")
                        
            elif isinstance(node, ast.If):
                features['control_flow_patterns'].append('if')
                
            elif isinstance(node, ast.For):
                features['control_flow_patterns'].append('for')
                
            elif isinstance(node, ast.While):
                features['control_flow_patterns'].append('while')
                
            elif isinstance(node, ast.Try):
                features['control_flow_patterns'].append('try')
                
            elif isinstance(node, (ast.Str, ast.Constant)):
                # Handle string literals for both Python 3.7 and 3.8+
                if hasattr(node, 's'):
                    if len(node.s) > 2:
                        features['string_literals'].append(node.s[:50])
                elif hasattr(node, 'value') and isinstance(node.value, str):
                    if len(node.value) > 2:
                        features['string_literals'].append(node.value[:50])
                    
            elif isinstance(node, ast.Name):
                if isinstance(node.ctx, ast.Store):
                    features['variable_names'].append(node.id)
        
        # AST structure representation
        features['ast_structures'] = [type(node).__name__ for node in ast.walk(tree)]
        
        # Extract keywords with regex
        python_keywords = ['def', 'class', 'if', 'else', 'elif', 'for', 'while', 'try', 'except', 'import', 'from']
        for keyword in python_keywords:
            count = len(re.findall(rf'\b{keyword}\b', code))
            features['keywords'].extend([keyword] * count)
    
    except Exception as e:
        print(f"  ⚠️ AST parsing failed: {e}")
    
    return features


def extract_js_features_enhanced(code):
    """Enhanced JavaScript/TypeScript feature extraction"""
    features = {
        'functions_count': 0,
        'imports': [],
        'keywords': [],
        'function_names': [],
        'variable_names': [],
        'string_literals': [],
        'control_flow_patterns': []
    }
    
    # Function detection (multiple patterns)
    function_patterns = [
        r'function\s+(\w+)',
        r'const\s+(\w+)\s*=\s*\([^)]*\)\s*=>',
        r'let\s+(\w+)\s*=\s*\([^)]*\)\s*=>',
        r'var\s+(\w+)\s*=\s*function',
        r'(\w+)\s*:\s*function\s*\(',
        r'async\s+function\s+(\w+)',
        r'(\w+)\s*\([^)]*\)\s*{',  # Method definitions
    ]
    
    for pattern in function_patterns:
        matches = re.findall(pattern, code)
        features['functions_count'] += len(matches)
        features['function_names'].extend([m for m in matches if m])
    
    # Import detection
    import_patterns = [
        r'import\s+.*\s+from\s+[\'"]([^\'"]+)[\'"]',
        r'import\s+[\'"]([^\'"]+)[\'"]',
        r'require\([\'"]([^\'"]+)[\'"]\)',
        r'import\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)',  # Dynamic imports
    ]
    
    for pattern in import_patterns:
        matches = re.findall(pattern, code)
        for match in matches:
            # Extract package name (first part before /)
            package = match.split('/')[0]
            if not package.startswith('.'):
                features['imports'].append(package)
    
    # Control flow patterns
    control_patterns = {
        'if': r'\bif\s*\(',
        'for': r'\bfor\s*\(',
        'while': r'\bwhile\s*\(',
        'switch': r'\bswitch\s*\(',
        'try': r'\btry\s*{',
        'function': r'\bfunction\b',
        'class': r'\bclass\s+\w+',
    }
    
    for pattern_name, pattern in control_patterns.items():
        matches = re.findall(pattern, code)
        features['control_flow_patterns'].extend([pattern_name] * len(matches))
    
    # Variable declarations
    var_patterns = [
        r'var\s+(\w+)',
        r'let\s+(\w+)',
        r'const\s+(\w+)',
    ]
    
    for pattern in var_patterns:
        matches = re.findall(pattern, code)
        features['variable_names'].extend(matches)
    
    # String literals (fixed regex)
    string_patterns = [
        r'"([^"\\\\]*(\\\\.[^"\\\\]*)*)"',
        r"'([^'\\\\]*(\\\\.[^'\\\\]*)*)'",
        r'`([^`\\\\]*(\\\\.[^`\\\\]*)*)`',  # Template literals (fixed)
    ]
    
    for pattern in string_patterns:
        matches = re.findall(pattern, code)
        for match in matches:
            if isinstance(match, tuple):
                match = match[0]
            if len(match) > 2:  # Only meaningful strings
                features['string_literals'].append(match[:50])
    
    # Keywords extraction
    js_keywords = ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'async', 'await']
    for keyword in js_keywords:
        count = len(re.findall(rf'\b{keyword}\b', code))
        features['keywords'].extend([keyword] * count)
    
    return features


def calculate_similarity_features_enhanced(features1, features2):
    """Calculate enhanced similarity features between two projects with debugging"""
    print(f"\n🔍 Comparing projects:")
    print(f"  Project 1: {len(features1.get('code_tokens', []))} tokens, {features1.get('total_lines', 0)} lines, {len(features1.get('file_hashes', []))} files")
    print(f"  Project 2: {len(features2.get('code_tokens', []))} tokens, {features2.get('total_lines', 0)} lines, {len(features2.get('file_hashes', []))} files")
    
    def jaccard_similarity(list1, list2):
        """Calculate Jaccard similarity between two lists"""
        set1, set2 = set(list1), set(list2)
        intersection = len(set1.intersection(set2))
        union = len(set1.union(set2))
        return intersection / union if union != 0 else 0

    # File hash similarity (exact matches) - MOST IMPORTANT FOR IDENTICAL FILES
    hashes1 = set(features1.get('file_hashes', []))
    hashes2 = set(features2.get('file_hashes', []))
    
    if hashes1 and hashes2:
        hash_intersection = len(hashes1.intersection(hashes2))
        hash_union = len(hashes1.union(hashes2))
        hash_similarity = hash_intersection / hash_union if hash_union > 0 else 0
        print(f"  🔗 Hash similarity: {hash_similarity:.3f} ({hash_intersection}/{hash_union} exact file matches)")
    else:
        hash_similarity = 0

    # TF-IDF similarity on code tokens
    try:
        tokens1 = features1.get('code_tokens', [])
        tokens2 = features2.get('code_tokens', [])
        
        if tokens1 and tokens2:
            # Create corpus from tokens
            text1 = ' '.join(tokens1)
            text2 = ' '.join(tokens2)
            corpus = [text1, text2]
            
            vectorizer = TfidfVectorizer(max_features=1000, min_df=1)
            tfidf_matrix = vectorizer.fit_transform(corpus)
            tfidf_similarity = cosine_similarity(tfidf_matrix[0], tfidf_matrix[1])
            print(f"  📝 TF-IDF similarity: {tfidf_similarity:.3f}")
        else:
            tfidf_similarity = 0
    except Exception as e:
        print(f"  ❌ TF-IDF error: {e}")
        tfidf_similarity = 0
    
    # Function name similarity
    funcs1 = set(features1.get('function_names', []))
    funcs2 = set(features2.get('function_names', []))
    if funcs1 or funcs2:
        func_intersection = len(funcs1.intersection(funcs2))
        func_union = len(funcs1.union(funcs2))
        function_similarity = func_intersection / func_union if func_union > 0 else 0
        print(f"  🔧 Function similarity: {function_similarity:.3f} ({func_intersection}/{func_union})")
    else:
        function_similarity = 0
    
    # Import similarity  
    imports1 = set(features1.get('imports', []))
    imports2 = set(features2.get('imports', []))
    if imports1 or imports2:
        import_intersection = len(imports1.intersection(imports2))
        import_union = len(imports1.union(imports2))
        import_similarity = import_intersection / import_union if import_union > 0 else 0
        print(f"  📦 Import similarity: {import_similarity:.3f} ({import_intersection}/{import_union})")
    else:
        import_similarity = 0
    
    # Variable name similarity
    vars1 = set(features1.get('variable_names', []))
    vars2 = set(features2.get('variable_names', []))
    variable_similarity = jaccard_similarity(list(vars1), list(vars2))
    
    # Structure similarity (file counts, line counts)
    length1 = features1.get('total_lines', 0)
    length2 = features2.get('total_lines', 0)
    if max(length1, length2) > 0:
        length_similarity = 1 - abs(length1 - length2) / max(length1, length2)
    else:
        length_similarity = 0
    
    # Keywords and control flow
    keyword_similarity = jaccard_similarity(features1.get('keywords', []), features2.get('keywords', []))
    
    # Calculate weighted overall similarity with emphasis on exact matches
    weights = {
        'hash': 0.50,        # HIGHEST weight for exact file matches
        'tfidf': 0.20,       # Content similarity
        'function': 0.15,    # Function names
        'import': 0.10,      # Imports
        'variable': 0.03,    # Variables
        'length': 0.02       # Structure
    }
    
    overall_similarity = (
        hash_similarity * weights['hash'] +
        tfidf_similarity * weights['tfidf'] +
        function_similarity * weights['function'] +
        import_similarity * weights['import'] +
        variable_similarity * weights['variable'] +
        length_similarity * weights['length']
    )
    
    print(f"  🎯 Overall similarity: {overall_similarity:.3f}")

    # After calculating all similarity_features
    similarity_features = {
        'hash_similarity': hash_similarity,
        'tfidf_similarity': tfidf_similarity,
        'import_similarity': import_similarity,
        'function_similarity': function_similarity,
        'variable_similarity': variable_similarity,
        'length_similarity': length_similarity,
        'keyword_similarity': keyword_similarity,
        'overall_similarity': overall_similarity,
        'structure_difference': 1 - length_similarity
    }
    
    # Force 100% similarity for exact file matches
    if hash_similarity >= 0.8:  # If 80% or more files are identical
        print(f"  🚨 EXACT MATCH DETECTED: Setting overall similarity to 1.0")
        similarity_features['overall_similarity'] = 1.0
    
    print(f"  🎯 Final Overall similarity: {similarity_features['overall_similarity']:.3f}")
    
    return similarity_features


# Backward compatibility functions
def extract_code_features(project_path):
    """Backward compatibility - calls enhanced version"""
    return extract_code_features_enhanced(project_path)


def calculate_similarity_features(features1, features2):
    """Backward compatibility - calls enhanced version"""
    return calculate_similarity_features_enhanced(features1, features2)


# Keep your existing recursive functions for nested ZIP support
def extract_batch_zip_file_recursive(zip_path, extract_to):
    """Use the standard function for now - recursive version can be added later"""
    return extract_batch_zip_file(zip_path, extract_to), {}
