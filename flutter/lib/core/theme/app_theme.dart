import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

class AppTheme {
  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    scaffoldBackgroundColor: AppColors.background,
    colorScheme: const ColorScheme.light(
      primary: AppColors.primary,
      secondary: AppColors.accentBlue,
      surface: AppColors.surface,
      error: AppColors.error,
    ),
    textTheme: GoogleFonts.interTextTheme().copyWith(
      headlineLarge: GoogleFonts.manrope(
        fontSize: 30.sp,
        fontWeight: FontWeight.w700,
        color: AppColors.textPrimary,
      ),
      headlineMedium: GoogleFonts.manrope(
        fontSize: 24.sp,
        fontWeight: FontWeight.w700,
        color: AppColors.textPrimary,
      ),
      titleLarge: GoogleFonts.manrope(
        fontSize: 20.sp,
        fontWeight: FontWeight.w700,
        color: AppColors.textPrimary,
      ),
      bodyLarge: GoogleFonts.inter(
        fontSize: 16.sp,
        color: AppColors.textSecondary,
        fontWeight: FontWeight.w400,
      ),
      bodyMedium: GoogleFonts.inter(
        fontSize: 14.sp,
        color: AppColors.textMuted,
        fontWeight: FontWeight.w400,
      ),
      labelLarge: GoogleFonts.inter(
        fontSize: 16.sp,
        fontWeight: FontWeight.w700,
        color: Colors.white,
      ),
    ),
    appBarTheme: AppBarTheme(
      centerTitle: false,
      elevation: 0,
      backgroundColor: AppColors.background,
      foregroundColor: AppColors.textPrimary,
      titleTextStyle: GoogleFonts.manrope(
        fontSize: 24.sp,
        fontWeight: FontWeight.w800,
        color: AppColors.primary,
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.surfaceMuted,
      contentPadding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 16.h),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(32.r),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(32.r),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(32.r),
        borderSide: BorderSide(color: AppColors.primary.withValues(alpha: 0.2)),
      ),
    ),
    dividerColor: AppColors.divider,
  );

  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    scaffoldBackgroundColor: const Color(0xFF101213),
    colorScheme: const ColorScheme.dark(
      primary: AppColors.primary,
      secondary: AppColors.accentBlue,
      surface: Color(0xFF171A1C),
      error: AppColors.error,
    ),
    textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme),
  );
}
