# authentication/email_utils.py
from django.core.mail import send_mail
from django.conf import settings
from django.urls import reverse
import secrets
import string

def generate_verification_token():
    """Generate a secure random token for email verification"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(32))

def send_verification_email(user, request):
    """Send email verification email to user"""
    # Generate verification token
    token = generate_verification_token()
    user.email_verification_token = token
    user.save()
    
    # ✅ Use your network IP instead of localhost
    verification_url = f"http://192.168.0.107:8000/api/auth/verify-email/{token}/"
    
    # Email content
    subject = 'Verify Your Email - CodeNest'
    message = f"""
    Hi {user.first_name or user.username},

    Welcome to CodeNest! Please verify your email address by clicking the link below:

    {verification_url}

    This link will expire in 24 hours for security reasons.

    If you didn't create an account with CodeNest, please ignore this email.

    Best regards,
    The CodeNest Team
    """
    
    html_message = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #6366f1;">CodeNest</h1>
                <p style="color: #666;">AI-Powered Code Analysis Platform</p>
            </div>
            
            <h2>Verify Your Email Address</h2>
            
            <p>Hi {user.first_name or user.username},</p>
            
            <p>Welcome to CodeNest! Please verify your email address to complete your registration.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{verification_url}" 
                   style="background-color: #6366f1; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 5px; display: inline-block;">
                    Verify Email Address
                </a>
            </div>
            
            <p><small>If the button doesn't work, copy and paste this link into your browser:</small></p>
            <p><small style="word-break: break-all; color: #666;">{verification_url}</small></p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            
            <p><small>This link will expire in 24 hours for security reasons.</small></p>
            <p><small>If you didn't create an account with CodeNest, please ignore this email.</small></p>
            
            <div style="text-align: center; margin-top: 30px; color: #666;">
                <p>Best regards,<br>The CodeNest Team</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Failed to send verification email: {e}")
        return False

def send_reset_code_email(email, reset_code):
    """Send password reset code email"""
    subject = 'CodeNest - Password Reset Code'
    
    message = f"""
Hi,

You requested to reset your password for your CodeNest account.

Your password reset code is: {reset_code}

This code will expire in 15 minutes for security reasons.

If you didn't request this password reset, please ignore this email.

Best regards,
The CodeNest Team
    """
    
    html_message = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">CodeNest - Password Reset</h2>
        
        <p>Hi,</p>
        
        <p>You requested to reset your password for your CodeNest account.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #1f2937; font-size: 32px; letter-spacing: 8px; margin: 0;">
                {reset_code}
            </h1>
            <p style="color: #6b7280; margin: 10px 0 0 0;">Enter this code to reset your password</p>
        </div>
        
        <p style="color: #ef4444;">⚠️ This code will expire in 15 minutes for security reasons.</p>
        
        <p>If you didn't request this password reset, please ignore this email.</p>
        
        <p>Best regards,<br>
        The CodeNest Team</p>
    </div>
    """
    
    try:
        send_mail(
            subject=subject,
            message=message,
            html_message=html_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending reset code email: {e}")
        return False
