import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';

class AdwethPrimaryButton extends StatelessWidget {
  const AdwethPrimaryButton({
    required this.label,
    required this.onPressed,
    super.key,
    this.leadingIcon,
    this.trailingIcon,
    this.backgroundColor,
    this.foregroundColor,
    this.height,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? leadingIcon;
  final IconData? trailingIcon;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final double? height;

  @override
  Widget build(BuildContext context) {
    final Color buttonBg = backgroundColor ?? AppColors.primary;
    final Color buttonFg = foregroundColor ?? Colors.white;

    return SizedBox(
      width: double.infinity,
      height: height ?? 56.h,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: buttonBg,
          foregroundColor: buttonFg,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(999.r),
          ),
          elevation: 0,
          shadowColor: AppColors.primary.withValues(alpha: 0.15),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            if (leadingIcon != null) ...<Widget>[
              Icon(leadingIcon, size: 18.sp),
              SizedBox(width: 8.w),
            ],
            Text(
              label,
              style: AppTextStyles.button.copyWith(color: buttonFg),
            ),
            if (trailingIcon != null) ...<Widget>[
              SizedBox(width: 8.w),
              Icon(trailingIcon, size: 16.sp),
            ],
          ],
        ),
      ),
    );
  }
}
