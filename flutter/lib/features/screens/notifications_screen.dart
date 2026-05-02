import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/state/app_ui_state.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    // Mark alert badge as seen when user opens this screen.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }
      ref.read(appUiProvider.notifier).clearNotifications();
    });
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: ListView(
        padding: EdgeInsets.fromLTRB(24.w, 20.h, 24.w, 100.h),
        children: <Widget>[
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: <Widget>[
              Text('ADWETH',
                  style: AppTextStyles.brand.copyWith(fontSize: 24.sp)),
              CircleAvatar(
                radius: 20.r,
                backgroundColor: AppColors.surfaceMuted,
                child: Icon(Icons.person_outline,
                    color: AppColors.textMuted, size: 20.sp),
              ),
            ],
          ),
          SizedBox(height: 24.h),
          Text('Alerts', style: AppTextStyles.h1),
          SizedBox(height: 8.h),
          Text(
            'Stay updated on medicine availability and health news.',
            style: AppTextStyles.body,
          ),
          SizedBox(height: 20.h),
          const _SectionHeader(
            title: 'Recent Updates',
            actionLabel: '3 NEW',
            actionBackground: AppColors.primarySoft,
            actionColor: AppColors.primary,
          ),
          SizedBox(height: 10.h),
          const _NotificationCard(
            icon: Icons.inventory_2_outlined,
            title: 'Medicine Back in Stock',
            subtitle:
                'Amoxicillin 500mg is now available at Green Cross Pharmacy near your location.',
            meta: '3 min ago',
            cta: 'View Details',
          ),
          SizedBox(height: 10.h),
          const _NotificationCard(
            icon: Icons.price_change_outlined,
            title: 'Price Drop Alert',
            subtitle:
                'The price for Insulin Glargine has decreased by 15% across major distributors.',
            meta: '12 min ago',
            badge: 'PRICE DROP',
          ),
          SizedBox(height: 10.h),
          const _NotificationCard(
            icon: Icons.new_releases_outlined,
            title: 'New Feature: Prescription Scan',
            subtitle:
                'You can now scan your physical prescriptions to instantly find the nearest available stocks.',
            meta: '1 hr ago',
          ),
          SizedBox(height: 20.h),
          Text('Earlier this week', style: AppTextStyles.h3),
          SizedBox(height: 10.h),
          const _HistoryTile(
            icon: Icons.construction_outlined,
            title: 'Scheduled Maintenance Complete',
            subtitle:
                'System optimizations are now live for faster search results.',
            time: '2d ago',
          ),
          const _HistoryTile(
            icon: Icons.eco_outlined,
            title: 'Health Tip: Seasonal Allergies',
            subtitle: 'Check out our new guide on managing pollen sensitivity.',
            time: '3d ago',
          ),
          const _HistoryTile(
            icon: Icons.security_outlined,
            title: 'Security Update',
            subtitle: 'Your login session was verified from a new device.',
            time: '4d ago',
          ),
          SizedBox(height: 12.h),
          Container(
            height: 44.h,
            decoration: BoxDecoration(
              color: AppColors.surfaceMuted,
              borderRadius: BorderRadius.circular(999.r),
            ),
            child: Center(
              child: Text(
                'View Older Alerts',
                style: AppTextStyles.label
                    .copyWith(color: AppColors.textSecondary),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.title,
    required this.actionLabel,
    required this.actionBackground,
    required this.actionColor,
  });

  final String title;
  final String actionLabel;
  final Color actionBackground;
  final Color actionColor;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: <Widget>[
        Text(title, style: AppTextStyles.h3),
        Container(
          padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 6.h),
          decoration: BoxDecoration(
            color: actionBackground,
            borderRadius: BorderRadius.circular(999.r),
          ),
          child: Text(
            actionLabel,
            style: AppTextStyles.captionCaps.copyWith(color: actionColor),
          ),
        ),
      ],
    );
  }
}

class _NotificationCard extends StatelessWidget {
  const _NotificationCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.meta,
    this.badge,
    this.cta,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final String meta;
  final String? badge;
  final String? cta;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(20.r),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(24.r),
        boxShadow: <BoxShadow>[
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Container(
            width: 48.r,
            height: 48.r,
            decoration: BoxDecoration(
              color: AppColors.primarySoft,
              borderRadius: BorderRadius.circular(14.r),
            ),
            child: Icon(icon, color: AppColors.primary),
          ),
          SizedBox(width: 14.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Expanded(child: Text(title, style: AppTextStyles.label)),
                    SizedBox(width: 8.w),
                    Text(meta,
                        style: AppTextStyles.captionCaps
                            .copyWith(letterSpacing: 0.2)),
                  ],
                ),
                SizedBox(height: 6.h),
                Text(subtitle,
                    style: AppTextStyles.bodySmall.copyWith(height: 1.45)),
                if (cta != null) ...<Widget>[
                  SizedBox(height: 8.h),
                  Text(
                    cta!,
                    style: AppTextStyles.label.copyWith(
                      color: AppColors.primary,
                      fontSize: 13.sp,
                    ),
                  ),
                ],
                if (badge != null) ...<Widget>[
                  SizedBox(height: 8.h),
                  Container(
                    padding:
                        EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
                    decoration: BoxDecoration(
                      color: AppColors.warning.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(10.r),
                    ),
                    child: Text(
                      badge!,
                      style: AppTextStyles.captionCaps.copyWith(
                        color: AppColors.warning,
                        letterSpacing: 0.4,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _HistoryTile extends StatelessWidget {
  const _HistoryTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.time,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final String time;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.only(bottom: 10.h),
      padding: EdgeInsets.all(16.r),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20.r),
      ),
      child: Row(
        children: <Widget>[
          Container(
            width: 40.r,
            height: 40.r,
            decoration: BoxDecoration(
              color: AppColors.surfaceMuted,
              borderRadius: BorderRadius.circular(12.r),
            ),
            child: Icon(icon, color: AppColors.textSecondary, size: 18.sp),
          ),
          SizedBox(width: 12.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(title,
                    style: AppTextStyles.label.copyWith(fontSize: 14.sp)),
                SizedBox(height: 4.h),
                Text(subtitle, style: AppTextStyles.bodySmall),
              ],
            ),
          ),
          SizedBox(width: 10.w),
          Text(time,
              style: AppTextStyles.captionCaps.copyWith(letterSpacing: 0.2)),
        ],
      ),
    );
  }
}
