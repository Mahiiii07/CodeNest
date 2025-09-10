import os
import tempfile
import shutil
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from .models import BatchUpload, ProjectSubmission, PlagiarismResult
from .ml_models import predict_plagiarism
import numpy as np
from django.db import models
from .utils import extract_batch_zip_file_recursive, extract_code_features_enhanced, calculate_similarity_features_enhanced

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def batch_plagiarism_check(request):
    """Enhanced batch upload with nested ZIP support"""
    if request.user.role != 'faculty':
        return Response({'error': 'Only faculty can perform batch checks'},
                       status=status.HTTP_403_FORBIDDEN)

    zip_file = request.FILES.get('zip_file')
    batch_name = request.data.get('batch_name', 'Untitled Batch')
    topic = request.data.get('topic', 'Unknown Topic')

    if not zip_file:
        return Response({'error': 'ZIP file is required'},
                       status=status.HTTP_400_BAD_REQUEST)

    try:
        # Save uploaded file
        upload_dir = os.path.join(settings.MEDIA_ROOT, 'uploads', 'batches')
        os.makedirs(upload_dir, exist_ok=True)
        zip_path = os.path.join(upload_dir, zip_file.name)
        
        with open(zip_path, 'wb+') as destination:
            for chunk in zip_file.chunks():
                destination.write(chunk)

        # Create batch record
        batch = BatchUpload.objects.create(
            faculty=request.user,
            batch_name=batch_name,
            topic=topic,
            file_path=zip_path
        )

        # Enhanced extraction with nested ZIP support
        temp_dir = tempfile.mkdtemp()
        try:
            print(f"Using temporary directory: {temp_dir}")
            extracted_projects, nested_structure = extract_batch_zip_file_recursive(zip_path, temp_dir)
            
            if not extracted_projects:
                return Response({
                    'error': 'No valid projects found in the ZIP file.'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Update batch with nested structure info
            batch.nested_zip_structure = nested_structure
            batch.total_nested_zips = len([p for p in nested_structure.values() if p['type'] == 'nested_zip'])
            batch.save()

            project_features = {}
            
            # Extract features from each project
            for project_name in extracted_projects:
                project_path = os.path.join(temp_dir, project_name)
                if os.path.exists(project_path):
                    print(f"Extracting features from: {project_name}")
                    features = extract_code_features_enhanced(project_path)
                    
                    # Get nested ZIP info
                    zip_info = nested_structure.get(project_name, {})
                    
                    # Save project submission with nested info
                    submission = ProjectSubmission.objects.create(
                        batch=batch,
                        student_id=project_name,
                        project_name=project_name,
                        file_path=project_path,
                        features=features,
                        parent_zip_name=zip_info.get('parent', 'root'),
                        extraction_level=zip_info.get('level', 0),
                        original_zip_path=zip_info.get('original_zip_path', '')
                    )
                    
                    project_features[submission.id] = {
                        'submission': submission,
                        'features': features,
                        'nested_info': zip_info
                    }

            # Generate plagiarism report 
            report = []
            results = []

            # Get all project_features keys (these are submission IDs)
            project_ids = list(project_features.keys())

            print(f"Generating plagiarism report for {len(project_ids)} projects...")

            # Compare all pairs of projects
            for i in range(len(project_ids)):
                for j in range(i + 1, len(project_ids)):
                    id1 = project_ids[i]
                    id2 = project_ids[j]
                    
                    # Fetch the actual ProjectSubmission objects from database
                    try:
                        obj1 = ProjectSubmission.objects.get(id=id1)
                        obj2 = ProjectSubmission.objects.get(id=id2)
                    except ProjectSubmission.DoesNotExist:
                        print(f"ProjectSubmission not found for IDs: {id1}, {id2}")
                        continue
                    
                    features1 = project_features[id1]['features']
                    features2 = project_features[id2]['features']
                    
                    # Calculate similarity using enhanced function
                    try:
                        similarity_metrics = calculate_similarity_features_enhanced(features1, features2)
                        similarity_score = similarity_metrics.get('overall_similarity', 0)
                        
                        # Determine if plagiarized (threshold = 0.7 or 70%)
                        is_plagiarized = similarity_score > 0.7
                        
                        # Create PlagiarismResult database entry
                        plagiarism_result = PlagiarismResult.objects.create(
                            batch=batch,
                            project1=obj1,
                            project2=obj2,
                            similarity_score=similarity_score,
                            is_plagiarized=is_plagiarized,
                            comparison_details=similarity_metrics
                        )
                        
                        # Add to report for frontend 
                        report.append({
                            'student_id_1': obj1.student_id,
                            'student_id_2': obj2.student_id,
                            'similarity_percentage': round(similarity_score * 100, 2),
                            'plagiarized_status': 'Yes' if is_plagiarized else 'No'
                        })
                        
                        # Add to results for detailed analysis
                        results.append({
                            'project1_id': obj1.id,
                            'project2_id': obj2.id,
                            'similarity_score': similarity_score,
                            'is_plagiarized': is_plagiarized,
                            'features': similarity_metrics
                        })
                        
                    except Exception as e:
                        print(f"Error comparing {obj1.student_id} and {obj2.student_id}: {e}")
                        # Add failed comparison to report
                        report.append({
                            'student_id_1': obj1.student_id,
                            'student_id_2': obj2.student_id,
                            'similarity_percentage': 0,
                            'plagiarized_status': 'Error'
                        })

            print(f"Plagiarism detection complete. Generated report for {len(project_ids)} students.")

            return Response({
                'batch_id': batch.id,
                'batch_name': batch_name,
                'topic': topic,
                'total_projects': len(project_features),
                'nested_structure': nested_structure,
                'total_nested_zips': batch.total_nested_zips,
                'plagiarism_report': report,  # This was undefined before
                'detailed_comparisons': results
            }, status=status.HTTP_200_OK)

            
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)
            
    except Exception as e:
        print(f"Processing failed: {str(e)}")
        return Response({'error': f'Processing failed: {str(e)}'},
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_batch_results(request, batch_id):
    """Enhanced batch results with correct plagiarism rate calculation"""
    try:
        batch = BatchUpload.objects.get(id=batch_id, faculty=request.user)
        results = PlagiarismResult.objects.filter(batch=batch)
        submissions = batch.submissions.all()

        # plagiarism counting
        total_projects = submissions.count()
        flagged_student_ids = set()
        
        # Count unique students involved in plagiarism
        for result in results:
            if result.is_plagiarized:
                flagged_student_ids.add(result.project1.student_id)
                flagged_student_ids.add(result.project2.student_id)
        
        flagged_projects = len(flagged_student_ids)
        clean_projects = total_projects - flagged_projects
        
        # Calculate correct plagiarism rate
        plagiarism_percentage = round((flagged_projects / total_projects * 100) if total_projects > 0 else 0, 1)
        
        print(f"🔍 Plagiarism Summary: {flagged_projects}/{total_projects} projects flagged = {plagiarism_percentage}%")

        # Build detailed comparisons for frontend
        detailed_results = []
        for result in results:
            detailed_results.append({
                'id': result.id,
                'student_id_1': result.project1.student_id,
                'student_id_2': result.project2.student_id,
                'similarity_percentage': round(result.similarity_score * 100, 2),
                'plagiarized_status': 'Yes' if result.is_plagiarized else 'No',
                'comparison_details': {
                    'project1_files': len(result.project1.features.get('file_hashes', [])),
                    'project2_files': len(result.project2.features.get('file_hashes', [])),
                    'created_at': result.created_at
                }
            })

        # Student summary
        student_summary = []
        for submission in submissions:
            student_plagiarism = results.filter(
                models.Q(project1=submission) | models.Q(project2=submission),
                is_plagiarized=True
            ).count()
            
            student_summary.append({
                'student_id': submission.student_id,
                'project_name': submission.project_name,
                'total_files': submission.features.get('total_files', 0),
                'code_lines': submission.features.get('code_lines', 0),
                'plagiarism_detected': student_plagiarism > 0,
                'plagiarism_count': student_plagiarism
            })

                # Build student projects for hierarchical display
            student_projects = []
            for submission in submissions:
                # Find highest similarity for this student
                max_similarity = 0
                similar_to = None
                plagiarism_detected = False
                
                for result in results:
                    if result.project1 == submission or result.project2 == submission:
                        if result.similarity_score > max_similarity:
                            max_similarity = result.similarity_score
                            plagiarism_detected = result.is_plagiarized
                            # Get the other student's name
                            similar_to = result.project2.student_id if result.project1 == submission else result.project1.student_id
                
                student_projects.append({
                    'student_id': submission.student_id,
                    'project_name': submission.project_name,
                    'similarity_percentage': round(max_similarity * 100, 2),
                    'plagiarism_detected': plagiarism_detected,
                    'similar_to': similar_to,
                    'total_files': submission.features.get('total_files', 0),
                    'code_lines': submission.features.get('code_lines', 0),
                    'status': 'Flagged' if plagiarism_detected else 'Clean'
                })

            # Create hierarchical structure (group by parent - for now all under 'root')
            hierarchical_projects = {
                'root': student_projects
            }

            return Response({
                'batch': {
                    'id': batch.id,
                    'batch_name': batch.batch_name,
                    'topic': batch.topic,
                    'uploaded_at': batch.uploaded_at,
                    'total_projects': total_projects
                },
                'summary': {
                    'total_comparisons': len(detailed_results),
                    'plagiarized_comparisons': len([r for r in results if r.is_plagiarized]),
                    'plagiarism_percentage': plagiarism_percentage,
                    'clean_projects': clean_projects,
                    'flagged_projects': flagged_projects
                },
                'detailed_results': detailed_results,
                'student_summary': student_summary,
                'hierarchical_projects': hierarchical_projects
            }, status=status.HTTP_200_OK)

    except BatchUpload.DoesNotExist:
        return Response({'error': 'Batch not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_faculty_batches(request):
    """Get all batches for the current faculty with pagination"""
    if request.user.role != 'faculty':
        return Response({'error': 'Only faculty can view batches'},
                       status=status.HTTP_403_FORBIDDEN)

    from rest_framework.pagination import PageNumberPagination
    
    batches = BatchUpload.objects.filter(faculty=request.user).order_by('-uploaded_at')
    
    # pagination
    paginator = PageNumberPagination()
    paginator.page_size = 12
    result_page = paginator.paginate_queryset(batches, request)
    
    batch_list = []
    for batch in result_page:
        total_projects = batch.submissions.count()
        plagiarism_cases = batch.results.filter(is_plagiarized=True).count()
        
        batch_data = {
            'id': batch.id,
            'batch_name': batch.batch_name,
            'topic': batch.topic,
            'uploaded_at': batch.uploaded_at,
            'total_projects': total_projects,
            'plagiarism_cases': plagiarism_cases,
            'plagiarism_percentage': round((plagiarism_cases / total_projects * 100) if total_projects > 0 else 0, 1),
            'status': 'Completed'
        }
        batch_list.append(batch_data)

    return paginator.get_paginated_response({'batches': batch_list})



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recent_batches(request):
    """Get recent 5 batches for the current faculty (for sidebar display)"""
    if request.user.role != 'faculty':
        return Response({'error': 'Only faculty can view batches'},
                       status=status.HTTP_403_FORBIDDEN)

    batches = BatchUpload.objects.filter(faculty=request.user).order_by('-uploaded_at')[:5]
    batch_list = []

    for batch in batches:
        total_projects = batch.submissions.count()
        plagiarism_cases = batch.results.filter(is_plagiarized=True).count()
        
        batch_data = {
            'id': batch.id,
            'batch_name': batch.batch_name,
            'topic': batch.topic,
            'uploaded_at': batch.uploaded_at,
            'total_projects': total_projects,
            'plagiarism_cases': plagiarism_cases,
            'plagiarism_percentage': round((plagiarism_cases / total_projects * 100) if total_projects > 0 else 0, 1)
        }
        batch_list.append(batch_data)

    return Response({
        'recent_batches': batch_list,
        'total_batches': BatchUpload.objects.filter(faculty=request.user).count()
    }, status=status.HTTP_200_OK)
