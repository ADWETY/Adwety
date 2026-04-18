import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';

class AdwethInputField extends StatelessWidget {
  const AdwethInputField({
    required this.label,
    required this.hint,
    required this.prefixIcon,
    super.key,
    this.obscureText = false,
    this.suffix,
    this.controller,
    this.onChanged,
    this.keyboardType,
    this.errorText,
  });

  final String label;
  final String hint;
  final IconData prefixIcon;
  final bool obscureText;
  final Widget? suffix;
  final TextEditingController? controller;
  final ValueChanged<String>? onChanged;
  final TextInputType? keyboardType;
  final String? errorText;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Padding(
          padding: EdgeInsets.only(left: 4.w, bottom: 6.h),
          child: Text(label, style: AppTextStyles.label),
        ),
        TextField(
          controller: controller,
          onChanged: onChanged,
          keyboardType: keyboardType,
          obscureText: obscureText,
          style: AppTextStyles.body.copyWith(color: AppColors.textPrimary),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: AppTextStyles.body.copyWith(
              color: AppColors.textMuted.withValues(alpha: 0.6),
            ),
            prefixIcon: Icon(
              prefixIcon,
              size: 20.sp,
              color: AppColors.textMuted,
            ),
            suffixIcon: suffix,
            errorText: errorText,
            errorStyle: AppTextStyles.bodySmall.copyWith(
              color: AppColors.error,
            ),
          ),
        ),
      ],
    );
  }
}
