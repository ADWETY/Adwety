import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../core/constants/app_assets.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

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
              Row(
                children: <Widget>[
                  Icon(Icons.search, color: AppColors.textMuted, size: 20.sp),
                  SizedBox(width: 14.w),
                  Icon(Icons.notifications_none_rounded,
                      color: AppColors.textMuted, size: 20.sp),
                ],
              ),
            ],
          ),
          SizedBox(height: 24.h),
          Center(
            child: Stack(
              clipBehavior: Clip.none,
              children: <Widget>[
                ClipRRect(
                  borderRadius: BorderRadius.circular(999.r),
                  child: CachedNetworkImage(
                    imageUrl: AppAssets.profileImageUrl,
                    width: 128.r,
                    height: 128.r,
                    fit: BoxFit.cover,
                  ),
                ),
                Positioned(
                  bottom: -2,
                  right: -2,
                  child: Container(
                    width: 34.r,
                    height: 34.r,
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(999.r),
                      boxShadow: <BoxShadow>[
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.35),
                          blurRadius: 10,
                        ),
                      ],
                    ),
                    child: Icon(Icons.edit_outlined,
                        color: Colors.white, size: 16.sp),
                  ),
                ),
              ],
            ),
          ),
          SizedBox(height: 20.h),
          Center(
            child: Text('Aley Harirson',
                style: AppTextStyles.h2.copyWith(fontSize: 32.sp)),
          ),
          SizedBox(height: 4.h),
          Center(
              child:
                  Text('aley.harirson86@mail.com', style: AppTextStyles.body)),
          SizedBox(height: 20.h),
          Row(
            children: <Widget>[
              Expanded(child: _chipButton('Edit Profile', selected: true)),
              SizedBox(width: 12.w),
              Expanded(child: _chipButton('Settings')),
            ],
          ),
          SizedBox(height: 24.h),
          _SectionCard(
            title: 'Recent Activity',
            action: 'View all',
            child: Column(
              children: <Widget>[
                _activityTile(
                  icon: Icons.search_rounded,
                  title: 'Cardiology Center Search',
                  subtitle: 'Located 3 matches near Central Park',
                  time: '5 min',
                ),
                _activityTile(
                  icon: Icons.medication_outlined,
                  title: 'Insulin Supply Availability',
                  subtitle: 'Checked 5 local pharmacies',
                  time: '1 hr',
                ),
                _activityTile(
                  icon: Icons.local_hospital_outlined,
                  title: 'Emergency ER Wait Times',
                  subtitle: 'Metropolitan General Hospital',
                  time: 'Yesterday',
                ),
              ],
            ),
          ),
          SizedBox(height: 14.h),
          Container(
            padding: EdgeInsets.all(24.r),
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(28.r),
              boxShadow: <BoxShadow>[
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.3),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Icon(Icons.health_and_safety_outlined,
                    color: Colors.white, size: 28.sp),
                SizedBox(height: 8.h),
                Text(
                  'Health Profile 94%\nComplete',
                  style: AppTextStyles.h2.copyWith(color: Colors.white),
                ),
                SizedBox(height: 6.h),
                Text(
                  'Add emergency contacts to reach 100%.',
                  style:
                      AppTextStyles.bodySmall.copyWith(color: Colors.white70),
                ),
                SizedBox(height: 12.h),
                Container(
                  padding:
                      EdgeInsets.symmetric(horizontal: 20.w, vertical: 12.h),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(999.r),
                  ),
                  child: Text(
                    'Complete Now',
                    style: AppTextStyles.label.copyWith(color: Colors.white),
                  ),
                ),
              ],
            ),
          ),
          SizedBox(height: 14.h),
          _SectionCard(
            title: 'Settings',
            child: Column(
              children: <Widget>[
                _settingsLink(
                    Icons.notifications_none_rounded, 'Notifications'),
                _settingsLink(Icons.privacy_tip_outlined, 'Privacy & Security'),
                SizedBox(height: 10.h),
                Container(
                  width: double.infinity,
                  height: 52.h,
                  decoration: BoxDecoration(
                    color: AppColors.error.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(16.r),
                  ),
                  child: Center(
                    child: Text(
                      'Log out',
                      style:
                          AppTextStyles.label.copyWith(color: AppColors.error),
                    ),
                  ),
                ),
              ],
            ),
          ),
          SizedBox(height: 14.h),
          GridView.count(
            crossAxisCount: 2,
            childAspectRatio: 1.56,
            crossAxisSpacing: 16.w,
            mainAxisSpacing: 16.h,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            children: const <Widget>[
              _StatCard('SEARCHES', '128'),
              _StatCard('SAVED', '14'),
              _StatCard('ALERTS', '3'),
              _StatCard('VISITS', '9'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _chipButton(String label, {bool selected = false}) {
    return Container(
      height: 44.h,
      decoration: BoxDecoration(
        color: selected ? AppColors.primary : AppColors.surfaceMuted,
        borderRadius: BorderRadius.circular(999.r),
      ),
      child: Center(
        child: Text(
          label,
          style: AppTextStyles.label.copyWith(
            color: selected ? Colors.white : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _activityTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required String time,
  }) {
    return Padding(
      padding: EdgeInsets.only(bottom: 14.h),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Container(
            width: 48.r,
            height: 48.r,
            decoration: BoxDecoration(
              color: AppColors.surfaceMuted,
              borderRadius: BorderRadius.circular(14.r),
            ),
            child: Icon(icon, color: AppColors.primary),
          ),
          SizedBox(width: 12.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(title, style: AppTextStyles.label),
                SizedBox(height: 4.h),
                Text(subtitle, style: AppTextStyles.bodySmall),
              ],
            ),
          ),
          SizedBox(width: 8.w),
          Text(time,
              style: AppTextStyles.captionCaps.copyWith(letterSpacing: 0.2)),
        ],
      ),
    );
  }

  Widget _settingsLink(IconData icon, String title) {
    return Container(
      margin: EdgeInsets.only(bottom: 10.h),
      height: 44.h,
      child: Row(
        children: <Widget>[
          Icon(icon, color: AppColors.textSecondary, size: 20.sp),
          SizedBox(width: 12.w),
          Expanded(child: Text(title, style: AppTextStyles.body)),
          Icon(Icons.chevron_right_rounded,
              color: AppColors.textMuted, size: 18.sp),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.child, this.title = '', this.action});

  final Widget child;
  final String title;
  final String? action;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(20.r),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(28.r),
        boxShadow: <BoxShadow>[
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 14,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          if (title.isNotEmpty)
            Padding(
              padding: EdgeInsets.only(bottom: 14.h),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: <Widget>[
                  Text(title, style: AppTextStyles.h3),
                  if (action != null)
                    Text(
                      action!,
                      style: AppTextStyles.label
                          .copyWith(color: AppColors.primary),
                    ),
                ],
              ),
            ),
          child,
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(22.r),
        boxShadow: <BoxShadow>[
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: <Widget>[
          Text(label,
              style: AppTextStyles.captionCaps.copyWith(letterSpacing: 0.2)),
          SizedBox(height: 8.h),
          Text(value, style: AppTextStyles.h2),
        ],
      ),
    );
  }
}
