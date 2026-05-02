import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../auth/presentation/viewmodels/auth_view_model.dart';
import '../widgets/adweth_input_field.dart';
import '../widgets/adweth_primary_button.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  late final TextEditingController _nameController;
  late final TextEditingController _emailController;
  late final TextEditingController _passwordController;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController();
    _emailController = TextEditingController();
    _passwordController = TextEditingController();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(authViewModelProvider.notifier).clearError();
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _onRegister() async {
    final bool success =
        await ref.read(authViewModelProvider.notifier).register(
              name: _nameController.text,
              email: _emailController.text,
              password: _passwordController.text,
            );

    if (!mounted || !success) {
      return;
    }

    context.go(AppRoutes.home);
  }

  @override
  Widget build(BuildContext context) {
    final AuthState authState = ref.watch(authViewModelProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Account'),
        leading: IconButton(
          onPressed: () => context.go(AppRoutes.login),
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(24.w, 12.h, 24.w, 24.h),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text('Join ADWETY', style: AppTextStyles.h1),
              SizedBox(height: 8.h),
              Text(
                'Create an account to search drugs and find nearby pharmacies.',
                style: AppTextStyles.body,
              ),
              SizedBox(height: 24.h),
              AdwethInputField(
                label: 'Full Name',
                hint: 'Your name',
                prefixIcon: Icons.person_outline_rounded,
                controller: _nameController,
              ),
              SizedBox(height: 14.h),
              AdwethInputField(
                label: 'Email',
                hint: 'name@example.com',
                prefixIcon: Icons.email_outlined,
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
              ),
              SizedBox(height: 14.h),
              AdwethInputField(
                label: 'Password',
                hint: 'At least 6 characters',
                prefixIcon: Icons.lock_outline_rounded,
                obscureText: true,
                controller: _passwordController,
              ),
              if (authState.errorMessage != null) ...<Widget>[
                SizedBox(height: 12.h),
                Container(
                  width: double.infinity,
                  padding:
                      EdgeInsets.symmetric(horizontal: 12.w, vertical: 10.h),
                  decoration: BoxDecoration(
                    color: AppColors.error.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                  child: Text(
                    authState.errorMessage!,
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.error,
                    ),
                  ),
                ),
              ],
              SizedBox(height: 24.h),
              AdwethPrimaryButton(
                label: authState.isLoading ? 'Creating account...' : 'Register',
                onPressed: authState.isLoading ? null : _onRegister,
              ),
              SizedBox(height: 16.h),
              Center(
                child: TextButton(
                  onPressed: () => context.go(AppRoutes.login),
                  child: Text(
                    'Already have an account? Sign in',
                    style:
                        AppTextStyles.body.copyWith(color: AppColors.primary),
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
