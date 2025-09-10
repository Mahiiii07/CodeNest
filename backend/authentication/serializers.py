# authentication/serializers.py
from rest_framework import serializers
from .models import CustomUser
import re

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password', 'role', 'first_name', 'last_name']

    def validate_username(self, value):
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_email(self, value):
        if value and CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        
        # Email format validation
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, value):
            raise serializers.ValidationError(
                "Email must be in valid format (e.g., user@example.com). "
                "It should contain @ symbol and a valid domain."
            )
        return value
        

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=password,
            role=validated_data.get('role', 'student')
        )
        return user

class UserSerializer(serializers.ModelSerializer):
    def validate_email(self, value):
        # Skip validation if email hasn't changed
        if self.instance and self.instance.email == value:
            return value
            
        # Check if email already exists for other users
        if CustomUser.objects.filter(email=value).exclude(id=self.instance.id if self.instance else None).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        
        # Email format validation
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, value):
            raise serializers.ValidationError(
                "Email must be in valid format (e.g., user@example.com). "
                "Email should contain @ symbol and a valid domain."
            )
        return value

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role', 'first_name', 'last_name', 'is_email_verified']
        read_only_fields = ['id', 'username']

class ForgotPasswordSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()

    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError("Email is required.")
        return value

    def validate_username(self, value):
        if not value:
            raise serializers.ValidationError("Username is required.")
        return value

    def validate(self, data):
        """Custom validation to check if user exists"""
        username = data.get('username')
        email = data.get('email')
        if not CustomUser.objects.filter(username=username, email=email).exists():
            raise serializers.ValidationError(
                "No user found with this username and email combination. Please verify your credentials."
            )
        
        return data



class VerifyResetCodeSerializer(serializers.Serializer):
    username = serializers.CharField()
    code = serializers.CharField(max_length=6)


class ResetPasswordSerializer(serializers.Serializer):
    username = serializers.CharField()
    code = serializers.CharField(max_length=6)
    new_password = serializers.CharField(min_length=6)
    confirm_password = serializers.CharField(min_length=6)

    def validate_new_password(self, value):
        if len(value) < 6:
            raise serializers.ValidationError("Password must be at least 6 characters long.")
        return value

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match.")
        return data
