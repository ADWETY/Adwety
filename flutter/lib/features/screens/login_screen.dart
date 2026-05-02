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

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  late final TextEditingController _emailController;
  late final TextEditingController _passwordController;

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController();
    _passwordController = TextEditingController();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(authViewModelProvider.notifier).clearError();
    });
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _onLogin() async {
    final bool success = await ref.read(authViewModelProvider.notifier).login(
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
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(24.w, 26.h, 24.w, 24.h),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Center(
                child: Column(
                  children: <Widget>[
                    Text('ADWETH', style: AppTextStyles.brand),
                    SizedBox(height: 8.h),
                    Text(
                      'Welcome to your health sanctuary',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(height: 44.h),
              Text('Welcome Back', style: AppTextStyles.h1),
              SizedBox(height: 8.h),
              Text(
                'Please enter your details to continue',
                style: AppTextStyles.body,
              ),
              SizedBox(height: 24.h),
              AdwethInputField(
                label: 'Email or Phone Number',
                hint: 'name@example.com',
                prefixIcon: Icons.email_outlined,
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
              ),
              SizedBox(height: 16.h),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: 4.w),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: <Widget>[
                        Text('Password', style: AppTextStyles.label),
                        Text(
                          'Use test: demo@adwety.app',
                          style: AppTextStyles.label.copyWith(
                            color: AppColors.primary,
                            fontSize: 12.sp,
                          ),
                        ),
                      ],
                    ),
                  ),
                  SizedBox(height: 6.h),
                  AdwethInputField(
                    label: '',
                    hint: '123456',
                    prefixIcon: Icons.lock_outline_rounded,
                    obscureText: true,
                    controller: _passwordController,
                    suffix: const Icon(Icons.visibility_outlined,
                        color: AppColors.textMuted),
                  ),
                ],
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
                label: authState.isLoading ? 'Signing in...' : 'Sign In',
                trailingIcon: Icons.arrow_forward,
                onPressed: authState.isLoading ? null : _onLogin,
              ),
              SizedBox(height: 24.h),
              Row(
                children: <Widget>[
                  const Expanded(child: Divider(color: AppColors.border)),
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16.w),
                    child: Text(
                      'OR CONTINUE WITH',
                      style: AppTextStyles.captionCaps.copyWith(
                        letterSpacing: 1.2,
                      ),
                    ),
                  ),
                  const Expanded(child: Divider(color: AppColors.border)),
                ],
              ),
              SizedBox(height: 20.h),
              Row(
                children: <Widget>[
                  Expanded(
                    child: _SocialButton(
                      icon: Icons.g_mobiledata_rounded,
                      label: 'Google',
                      onTap: _onLogin,
                    ),
                  ),
                  SizedBox(width: 16.w),
                  Expanded(
                    child: _SocialButton(
                      icon: Icons.apple,
                      label: 'Apple',
                      onTap: _onLogin,
                    ),
                  ),
                ],
              ),
              SizedBox(height: 28.h),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: <Widget>[
                  Text('Don\'t have an account? ', style: AppTextStyles.body),
                  TextButton(
                    onPressed: () => context.go(AppRoutes.register),
                    child: Text(
                      'Sign Up',
                      style: AppTextStyles.body.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
              SizedBox(height: 36.h),
              Center(
                child: Column(
                  children: <Widget>[
                    Text(
                      'PRIVACY POLICY | TERMS OF SERVICE',
                      style: AppTextStyles.captionCaps,
                    ),
                    SizedBox(height: 12.h),
                    Text(
                      '(c) 2024 ADWETY HEALTHCARE INC.',
                      style: AppTextStyles.captionCaps,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SocialButton extends StatelessWidget {
  const _SocialButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surfaceMuted,
      borderRadius: BorderRadius.circular(32.r),
      child: InkWell(
        borderRadius: BorderRadius.circular(32.r),
        onTap: onTap,
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 16.h),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              Icon(icon, size: 20.sp, color: AppColors.textPrimary),
              SizedBox(width: 10.w),
              Text(
                label,
                style:
                    AppTextStyles.label.copyWith(fontWeight: FontWeight.w700),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
