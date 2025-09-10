from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'is_email_verified', 'is_active', 'date_joined']
    list_filter = ['role', 'is_active', 'is_staff', 'is_email_verified', 'date_joined']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['username']

    fieldsets = UserAdmin.fieldsets + (
        ('Custom Fields', {'fields': ('role', 'is_email_verified')}),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Custom Fields', {'fields': ('role', 'is_email_verified')}),
    )

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
