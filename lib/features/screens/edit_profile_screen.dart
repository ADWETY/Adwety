import 'package:flutter/material.dart';
import 'package:flutter_application_adwety/core/constants/app_routes.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../widgets/adweth_input_field.dart';
import '../widgets/adweth_primary_button.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  late final TextEditingController _nameController;
  late final TextEditingController _emailController;
  late final TextEditingController _phoneController;
  late final TextEditingController _addressController;
  String? _nameError;
  String? _emailError;
  String? _phoneError;

  @override
  void initState() {
    super.initState();
    // Initialize with current user data (mock data for now)
    _nameController = TextEditingController(text: 'Aley Harirson');
    _emailController = TextEditingController(text: 'aley.harirson86@mail.com');
    _phoneController = TextEditingController(text: '+1 234 567 8900');
    _addressController = TextEditingController(
      text: '123 Main Street, New York',
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  bool _validateInputs() {
    bool isValid = true;
    setState(() {
      // Validate name
      final name = _nameController.text.trim();
      if (name.isEmpty) {
        _nameError = 'Name is required';
        isValid = false;
      } else if (name.length < 2) {
        _nameError = 'Name must be at least 2 characters';
        isValid = false;
      } else {
        _nameError = null;
      }

      // Validate email
      final email = _emailController.text.trim();
      if (email.isEmpty) {
        _emailError = 'Email is required';
        isValid = false;
      } else if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email)) {
        _emailError = 'Please enter a valid email';
        isValid = false;
      } else {
        _emailError = null;
      }

      // Validate phone (optional but if provided must be valid)
      final phone = _phoneController.text.trim();
      if (phone.isNotEmpty && phone.length < 10) {
        _phoneError = 'Please enter a valid phone number';
        isValid = false;
      } else {
        _phoneError = null;
      }
    });
    return isValid;
  }

  Future<void> _onSave() async {
    if (!_validateInputs()) {
      return;
    }

    // Show success message
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Profile updated successfully!'),
        backgroundColor: AppColors.primary,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12.r),
        ),
        duration: const Duration(seconds: 2),
      ),
    );

    // Wait for snackbar to finish
    await Future.delayed(const Duration(seconds: 2));

    if (mounted) {
      context.go(AppRoutes.profile);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Profile'),
        leading: IconButton(
          onPressed: () => context.go(AppRoutes.profile),
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(24.w, 12.h, 24.w, 24.h),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Center(
                child: Stack(
                  children: <Widget>[
                    CircleAvatar(
                      radius: 60.r,
                      backgroundColor: AppColors.surfaceMuted,
                      child: Icon(
                        Icons.person_outline_rounded,
                        size: 60.r,
                        color: AppColors.textMuted,
                      ),
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        width: 36.r,
                        height: 36.r,
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(999.r),
                        ),
                        child: Icon(
                          Icons.camera_alt_outlined,
                          color: Colors.white,
                          size: 18.sp,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(height: 32.h),
              Text('Personal Information', style: AppTextStyles.h3),
              SizedBox(height: 16.h),
              AdwethInputField(
                label: 'Full Name',
                hint: 'Your name',
                prefixIcon: Icons.person_outline_rounded,
                controller: _nameController,
                errorText: _nameError,
              ),
              SizedBox(height: 14.h),
              AdwethInputField(
                label: 'Email',
                hint: 'name@example.com',
                prefixIcon: Icons.email_outlined,
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                errorText: _emailError,
              ),
              SizedBox(height: 14.h),
              AdwethInputField(
                label: 'Phone Number',
                hint: '+1 234 567 8900',
                prefixIcon: Icons.phone_outlined,
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                errorText: _phoneError,
              ),
              SizedBox(height: 14.h),
              AdwethInputField(
                label: 'Address',
                hint: 'Your address',
                prefixIcon: Icons.location_on_outlined,
                controller: _addressController,
              ),
              SizedBox(height: 32.h),
              AdwethPrimaryButton(label: 'Save Changes', onPressed: _onSave),
              SizedBox(height: 16.h),
              Center(
                child: TextButton(
                  onPressed: () => context.go(AppRoutes.profile),
                  child: Text(
                    'Cancel',
                    style: AppTextStyles.body.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
