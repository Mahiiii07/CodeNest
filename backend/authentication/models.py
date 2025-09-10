from django.contrib.auth.models import AbstractUser
from django.core.validators import EmailValidator
from django.db import models

class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('faculty', 'Faculty'),
        ('student', 'Student'),
    ]
    
    email = models.EmailField(
        unique=True,
        validators=[EmailValidator()],
        error_messages={
            'unique': "A user with that email already exists.",
            'invalid': "Enter a valid email address.",
        }
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    created_at = models.DateTimeField(auto_now_add=True)
    is_email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=255, blank=True, null=True)
    reset_password_code = models.CharField(max_length=6, blank=True, null=True)
    reset_code_expiry = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.username} - {self.role}"
