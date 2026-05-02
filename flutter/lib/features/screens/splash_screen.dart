import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants/app_assets.dart';
import '../../core/constants/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    Timer(const Duration(seconds: 2), () {
      if (!mounted) {
        return;
      }
      context.go(AppRoutes.onboarding);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          color: AppColors.background,
        ),
        child: SafeArea(
          child: Stack(
            children: <Widget>[
              Positioned(
                top: 120.h,
                left: -40.w,
                child: _blurCircle(size: 180.w, color: AppColors.primarySoft),
              ),
              Positioned(
                bottom: 80.h,
                right: -20.w,
                child: _blurCircle(size: 140.w, color: const Color(0x1AB9EBCA)),
              ),
              Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: <Widget>[
                    Container(
                      padding: EdgeInsets.all(34.r),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(36.r),
                        boxShadow: <BoxShadow>[
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.08),
                            blurRadius: 32,
                            offset: const Offset(0, 16),
                          ),
                        ],
                      ),
                      child: SvgPicture.asset(
                        AppAssets.iconPill,
                        width: 64.w,
                        height: 64.w,
                      ),
                    ),
                    SizedBox(height: 22.h),
                    Text('ADWETH', style: AppTextStyles.brand),
                    SizedBox(height: 8.h),
                    Text(
                      'Your Health is Our Priority',
                      style: AppTextStyles.body,
                    ),
                    SizedBox(height: 42.h),
                    SizedBox(
                      width: 192.w,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(999.r),
                        child: const LinearProgressIndicator(
                          minHeight: 4,
                          value: 0.65,
                          backgroundColor: AppColors.border,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Positioned(
                bottom: 24.h,
                left: 0,
                right: 0,
                child: Center(
                  child: Text(
                    '2026 ADWETY HEALTHCARE INC.',
                    style: AppTextStyles.captionCaps,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _blurCircle({required double size, required Color color}) {
    return Container(
      height: size,
      width: size,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(size),
      ),
    );
  }
}
