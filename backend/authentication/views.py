from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from .email_utils import send_verification_email
import logging
from django.http import HttpResponse
import secrets
import string
from .serializers import (
    UserRegistrationSerializer, UserSerializer,
    ForgotPasswordSerializer, VerifyResetCodeSerializer, ResetPasswordSerializer
)
from .email_utils import send_reset_code_email
from .models import CustomUser

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """User registration endpoint with email verification"""
    logger.info(f"Registration attempt for username: {request.data.get('username')}")
    serializer = UserRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            with transaction.atomic():
                user = serializer.save()
                
                # Send verification email
                email_sent = send_verification_email(user, request)
                
                # Generate JWT tokens for the new user
                refresh = RefreshToken.for_user(user)
                access_token = refresh.access_token

                logger.info(f"User registered successfully: {user.username}")
                
                response_data = {
                    'message': 'Registration successful',
                    'user': UserSerializer(user).data,
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(access_token),
                    }
                }
                
                # email verification message
                if email_sent:
                    response_data['email_message'] = 'Verification email sent successfully. Please check your inbox and click the verification link.'
                else:
                    response_data['email_message'] = 'Registration successful, but verification email failed to send. You can resend it from your profile.'
                
                return Response(response_data, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            logger.error(f"Registration failed: {str(e)}")
            return Response({
                'error': f'Registration failed: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    logger.warning(f"Registration failed - validation errors: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """User login endpoint"""
    from django.contrib.auth import authenticate
    
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({
            'error': 'Username and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(username=username, password=password)
    
    if user is not None:
        if user.is_active:
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            logger.info(f"User logged in successfully: {user.username}")
            
            return Response({
                'message': 'Login successful',
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(access_token),
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'User account is disabled'
            }, status=status.HTTP_400_BAD_REQUEST)
    else:
        return Response({
            'error': 'Invalid login credentials'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """User logout endpoint - blacklists the refresh token"""
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
            
        logger.info(f"User logged out successfully: {request.user.username}")
        return Response({
            'message': 'Logout successful'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return Response({
            'message': 'Logout successful'  
        }, status=status.HTTP_200_OK)

@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile(request):
    """Get or update current user profile"""
    user = request.user
    
    if request.method == 'GET':
        return Response({
            'user': UserSerializer(user).data  
        }, status=status.HTTP_200_OK)
    
    elif request.method in ['PUT', 'PATCH']:
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            # Save the user with updated data
            updated_user = serializer.save()
            
            # Mark email as unverified if email was changed
            if 'email' in request.data and updated_user.email != user.email:
                updated_user.is_email_verified = False
                updated_user.save()
            
            logger.info(f"Profile updated successfully: {updated_user.username}")
            return Response({
                'user': UserSerializer(updated_user).data,
                'message': 'Profile updated successfully'
            }, status=status.HTTP_200_OK)
        
        # Return detailed validation errors
        return Response({
            'error': 'Validation failed',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([AllowAny])
def verify_email(request, token):
    """Email verification endpoint"""
    try:
        from .models import CustomUser
        
        print(f"Verification attempt with token: {token}")
        
        # Find user with this verification token
        user = CustomUser.objects.get(
            email_verification_token=token,
            is_email_verified=False
        )
        
        print(f"Found user: {user.username}")
        
        # Check if token is not too old (24 hours)
        token_age = timezone.now() - user.created_at
        if token_age > timedelta(hours=24):
            print("Token expired")
            return HttpResponse("""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Link Expired - CodeNest</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 20px; background: #f3f4f6; margin: 0; }
                    .container { max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .header { display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
                    .logo { height: 40px; width: 40px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; margin-right: 12px; }
                    .title { font-size: 24px; color: #6366f1; font-weight: bold; }
                    .error { color: #f59e0b; font-size: 20px; margin-bottom: 15px; }
                    .button { background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 5px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">CN</div>
                        <div class="title">CodeNest</div>
                    </div>
                    <div class="error">⚠️ Link Expired</div>
                    <p>This verification link has expired. Please request a new verification email.</p>
                    <a href="http://192.168.0.107:5173/login" class="button">Go to Login</a>
                </div>
            </body>
            </html>
            """, content_type='text/html; charset=utf-8', status=400)
        
        # ✅ VERIFY THE EMAIL
        user.is_email_verified = True
        user.email_verification_token = None  # Clear the token
        user.save()
        
        print(f"✅ Email verified successfully for user: {user.username}")
        
        # Return mobile-friendly success HTML page with your custom logo
        html_response = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verified - CodeNest</title>
            <style>
                body {{ 
                    font-family: Arial, sans-serif; 
                    text-align: center; 
                    padding: 20px; 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    min-height: 100vh;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }}
                .container {{ 
                    max-width: 400px; 
                    background: white; 
                    color: #333; 
                    padding: 30px; 
                    border-radius: 15px; 
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1); 
                }}
                .header {{
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 25px;
                }}
                .logo {{
                    height: 50px;
                    width: 50px;
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 20px;
                    margin-right: 12px;
                }}
                .title {{
                    font-size: 28px;
                    color: #6366f1;
                    font-weight: bold;
                }}
                .success {{ color: #10b981; font-size: 28px; margin-bottom: 20px; }}
                .button {{ 
                    background: linear-gradient(135deg, #6366f1, #8b5cf6); 
                    color: white; 
                    padding: 15px 25px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    display: inline-block; 
                    margin: 10px 5px; 
                    transition: transform 0.2s;
                    font-size: 14px;
                }}
                .button:hover {{ transform: translateY(-2px); }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">CN</div>
                    <div class="title">CodeNest</div>
                </div>
                <div class="success">✅ Email Verified!</div>
                <p><strong>{user.first_name or user.username}</strong></p>
                <p>Your email has been verified successfully!</p>
                <p>You can now access all features of CodeNest.</p>
                <div>
                    <a href="http://192.168.0.107:5173/login" class="button">Login</a>
                    <a href="http://192.168.0.107:5173/profile" class="button">Profile</a>
                </div>
            </div>
        </body>
        </html>
        """
        
        return HttpResponse(html_response, content_type='text/html; charset=utf-8')
        
    except CustomUser.DoesNotExist:
        print("Token not found or already used")
        return HttpResponse("""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invalid Link - CodeNest</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 20px; background: #f3f4f6; margin: 0; }
                .container { max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .header { display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
                .logo { height: 40px; width: 40px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; margin-right: 12px; }
                .title { font-size: 24px; color: #6366f1; font-weight: bold; }
                .error { color: #ef4444; font-size: 20px; margin-bottom: 15px; }
                .button { background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">CN</div>
                    <div class="title">CodeNest</div>
                </div>
                <div class="error">❌ Invalid Link</div>
                <p>This verification link is invalid or has already been used.</p>
                <a href="http://192.168.0.107:5173/login" class="button">Go to Login</a>
            </div>
        </body>
        </html>
        """, content_type='text/html; charset=utf-8', status=400)
    except Exception as e:
        print(f"Email verification failed: {str(e)}")
        return HttpResponse("""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Error - CodeNest</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 20px; background: #f3f4f6; margin: 0; }
                .container { max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .header { display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
                .logo { height: 40px; width: 40px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; margin-right: 12px; }
                .title { font-size: 24px; color: #6366f1; font-weight: bold; }
                .error { color: #ef4444; font-size: 20px; margin-bottom: 15px; }
                .button { background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">CN</div>
                    <div class="title">CodeNest</div>
                </div>
                <div class="error">⚠️ Error</div>
                <p>Verification failed. Please try again or contact support.</p>
                <a href="http://192.168.0.107:5173/login" class="button">Go to Login</a>
            </div>
        </body>
        </html>
        """, content_type='text/html; charset=utf-8', status=500)


    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resend_verification_email(request):
    """Resend verification email"""
    user = request.user
    
    if user.is_email_verified:
        return Response({
            'message': 'Email is already verified.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Send verification email
    email_sent = send_verification_email(user, request)
    
    if email_sent:
        return Response({
            'message': 'Verification email sent successfully. Please check your inbox.'
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            'error': 'Failed to send verification email. Please try again later.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def refresh_token(request):
    """Refresh access token"""
    try:
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({
                'error': 'Refresh token is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        refresh = RefreshToken(refresh_token)
        access_token = refresh.access_token
        
        return Response({
            'access': str(access_token)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': 'Invalid refresh token'
        }, status=status.HTTP_400_BAD_REQUEST)

def generate_reset_code():
    """Generate a secure 6-digit alphanumeric code"""
    characters = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(characters) for _ in range(6))

# authentication/views.py (update the forgot_password view)

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    """Request password reset code"""
    serializer = ForgotPasswordSerializer(data=request.data)
    if serializer.is_valid():
        username = serializer.validated_data['username']
        email = serializer.validated_data['email']
        
        user = CustomUser.objects.filter(username=username, email=email).first()
        if user:
            # Generate 6-digit reset code
            reset_code = generate_reset_code()
            user.reset_password_code = reset_code
            user.reset_code_expiry = timezone.now() + timedelta(minutes=15)
            user.save()
            
            # Send email with reset code
            try:
                send_reset_code_email(user.email, reset_code)
                logger.info(f"Reset code sent to {user.username}")
            except Exception as e:
                logger.error(f"Failed to send reset email: {e}")
            
            return Response({
                'message': 'Reset code has been sent to your email address.'
            }, status=status.HTTP_200_OK)
        else:
            # ✅ IMPROVED ERROR MESSAGE
            return Response({
                'error': 'No user found with this username and email combination. Please check your credentials.'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_reset_code(request):
    """Verify the reset code"""
    serializer = VerifyResetCodeSerializer(data=request.data)
    if serializer.is_valid():
        username = serializer.validated_data['username']
        code = serializer.validated_data['code']
        
        user = CustomUser.objects.filter(
            username=username,
            reset_password_code=code
        ).first()
        
        if user and user.reset_code_expiry and user.reset_code_expiry > timezone.now():
            return Response({
                'message': 'Reset code verified successfully.'
            }, status=status.HTTP_200_OK)
        else:
            # ✅ IMPROVED ERROR MESSAGE
            return Response({
                'error': 'Invalid or expired reset code. Please request a new code.'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """Reset password with verified code"""
    serializer = ResetPasswordSerializer(data=request.data)
    if serializer.is_valid():
        username = serializer.validated_data['username']
        code = serializer.validated_data['code']
        new_password = serializer.validated_data['new_password']
        
        user = CustomUser.objects.filter(
            username=username,
            reset_password_code=code
        ).first()
        
        if user and user.reset_code_expiry and user.reset_code_expiry > timezone.now():
            # Reset password and clear reset code
            user.set_password(new_password)
            user.reset_password_code = None
            user.reset_code_expiry = None
            user.save()
            
            logger.info(f"Password reset successful for {user.username}")
            return Response({
                'message': 'Password reset successfully.'
            }, status=status.HTTP_200_OK)
        else:
            # ✅ IMPROVED ERROR MESSAGE
            return Response({
                'error': 'Reset session has expired. Please start the password reset process again.'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
