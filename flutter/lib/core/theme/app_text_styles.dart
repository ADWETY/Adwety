import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

class AppTextStyles {
  static TextStyle brand = GoogleFonts.manrope(
    fontSize: 30.sp,
    fontWeight: FontWeight.w800,
    letterSpacing: -1.5,
    color: AppColors.primary,
  );

  static TextStyle h1 = GoogleFonts.manrope(
    fontSize: 30.sp,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.75,
    color: AppColors.textPrimary,
    height: 1.2,
  );

  static TextStyle h2 = GoogleFonts.manrope(
    fontSize: 24.sp,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.4,
    color: AppColors.textPrimary,
    height: 1.25,
  );

  static TextStyle h3 = GoogleFonts.manrope(
    fontSize: 20.sp,
    fontWeight: FontWeight.w700,
    color: AppColors.textPrimary,
    height: 1.3,
  );

  static TextStyle body = GoogleFonts.inter(
    fontSize: 16.sp,
    fontWeight: FontWeight.w400,
    color: AppColors.textSecondary,
    height: 1.5,
  );

  static TextStyle bodySmall = GoogleFonts.inter(
    fontSize: 14.sp,
    fontWeight: FontWeight.w400,
    color: AppColors.textMuted,
    height: 1.4,
  );

  static TextStyle label = GoogleFonts.inter(
    fontSize: 14.sp,
    fontWeight: FontWeight.w600,
    color: AppColors.textPrimary,
    height: 1.4,
  );

  static TextStyle button = GoogleFonts.inter(
    fontSize: 16.sp,
    fontWeight: FontWeight.w700,
    color: Colors.white,
    height: 1.4,
  );

  static TextStyle captionCaps = GoogleFonts.inter(
    fontSize: 10.sp,
    fontWeight: FontWeight.w700,
    color: AppColors.textMuted,
    letterSpacing: 1,
    height: 1.5,
  );
}
