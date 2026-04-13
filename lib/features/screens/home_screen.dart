import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/constants/app_assets.dart';
import '../../core/constants/app_routes.dart';
import '../../core/state/app_ui_state.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../home/domain/entities/pharmacy.dart';
import '../home/presentation/providers/home_providers.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AppUiState state = ref.watch(appUiProvider);
    final AppUiNotifier notifier = ref.read(appUiProvider.notifier);
    final AsyncValue<List<Pharmacy>> trustedPharmacies =
        ref.watch(trustedPharmaciesProvider);

    return SafeArea(
      bottom: false,
      child: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(24.w, 18.h, 24.w, 100.h),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: <Widget>[
                Text(
                  'ADWETH',
                  style: AppTextStyles.brand.copyWith(fontSize: 24.sp),
                ),
                ClipRRect(
                  borderRadius: BorderRadius.circular(20.r),
                  child: CachedNetworkImage(
                    imageUrl: AppAssets.profileImageUrl,
                    height: 40.r,
                    width: 40.r,
                    fit: BoxFit.cover,
                  ),
                ),
              ],
            ),
            SizedBox(height: 24.h),
            Text('Find your wellness.', style: AppTextStyles.h1),
            SizedBox(height: 16.h),
            InkWell(
              borderRadius: BorderRadius.circular(24.r),
              onTap: () => context.go(AppRoutes.search),
              child: Container(
                height: 64.h,
                decoration: BoxDecoration(
                  color: AppColors.surfaceMuted,
                  borderRadius: BorderRadius.circular(24.r),
                ),
                child: Row(
                  children: <Widget>[
                    SizedBox(width: 20.w),
                    Icon(Icons.search_rounded,
                        color: AppColors.textMuted, size: 20.sp),
                    SizedBox(width: 14.w),
                    Expanded(
                      child: Text(
                        'Search medicine, brands, or symptoms',
                        style: AppTextStyles.bodySmall,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            SizedBox(height: 24.h),
            LayoutBuilder(
              builder: (BuildContext context, BoxConstraints constraints) {
                final double cardWidth = (constraints.maxWidth - 16.w) / 2;
                return Row(
                  children: <Widget>[
                    _QuickActionCard(
                      width: cardWidth,
                      title: 'Scan\nMedicine',
                      subtitle: 'Identify instantly',
                      icon: Icons.qr_code_scanner_rounded,
                      onTap: () => context.go(AppRoutes.scan),
                    ),
                    SizedBox(width: 16.w),
                    _QuickActionCard(
                      width: cardWidth,
                      title: 'Nearby\nPharmacies',
                      subtitle: 'Open 24/7',
                      icon: Icons.location_on_outlined,
                      onTap: () => context.go(AppRoutes.map),
                    ),
                  ],
                );
              },
            ),
            SizedBox(height: 28.h),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: <Widget>[
                Text('Categories', style: AppTextStyles.h3),
                Text('View all',
                    style:
                        AppTextStyles.label.copyWith(color: AppColors.primary)),
              ],
            ),
            SizedBox(height: 16.h),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: <_CategoryData>[
                  const _CategoryData('Scan Medicine', AppAssets.iconScan),
                  const _CategoryData('Nearby Pharmacies', AppAssets.iconPin),
                  const _CategoryData('Diverse Health', AppAssets.iconShield),
                  const _CategoryData('MediCare', AppAssets.iconBell),
                ].map((_CategoryData category) {
                  final bool selected =
                      state.selectedCategory == category.label;
                  return Padding(
                    padding: EdgeInsets.only(right: 12.w),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(20.r),
                      onTap: () => notifier.setSelectedCategory(category.label),
                      child: Column(
                        children: <Widget>[
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            height: 64.r,
                            width: 64.r,
                            decoration: BoxDecoration(
                              color: selected
                                  ? AppColors.primarySoft
                                  : AppColors.surface,
                              borderRadius: BorderRadius.circular(20.r),
                              border: Border.all(
                                color: selected
                                    ? AppColors.primary.withValues(alpha: 0.25)
                                    : AppColors.border,
                              ),
                            ),
                            child: Center(
                              child: SvgPicture.asset(
                                category.asset,
                                height: 20.r,
                                width: 20.r,
                                colorFilter: ColorFilter.mode(
                                  selected
                                      ? AppColors.primary
                                      : AppColors.textMuted,
                                  BlendMode.srcIn,
                                ),
                              ),
                            ),
                          ),
                          SizedBox(height: 8.h),
                          SizedBox(
                            width: 84.w,
                            child: Text(
                              category.label,
                              style: AppTextStyles.captionCaps.copyWith(
                                letterSpacing: 0,
                                fontSize: 11.sp,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            SizedBox(height: 24.h),
            Text('Trusted Pharmacies', style: AppTextStyles.h3),
            SizedBox(height: 14.h),
            trustedPharmacies.when(
              data: (List<Pharmacy> pharmacies) {
                return Column(
                  children: pharmacies
                      .map(
                        (Pharmacy pharmacy) => Padding(
                          padding: EdgeInsets.only(bottom: 12.h),
                          child: _TrustedPharmacyCard(
                            image: pharmacy.imageUrl,
                            title: pharmacy.name,
                            eta: '${(pharmacy.distanceKm * 4).round()} Min',
                            rating: pharmacy.rating.toStringAsFixed(1),
                            onTapVisit: () => context.go(AppRoutes.pharmacy),
                          ),
                        ),
                      )
                      .toList(),
                );
              },
              loading: () => const Center(
                child: CircularProgressIndicator(color: AppColors.primary),
              ),
              error: (_, __) => _TrustedPharmacyCard(
                image:
                    'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&q=80',
                title: 'Green Life Pharmacy',
                eta: '10 Min',
                rating: '4.9',
                onTapVisit: () => context.go(AppRoutes.pharmacy),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  const _QuickActionCard({
    required this.width,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onTap,
  });

  final double width;
  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(28.r),
      onTap: onTap,
      child: Container(
        width: width,
        padding: EdgeInsets.all(20.r),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(28.r),
          boxShadow: <BoxShadow>[
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 16,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Container(
              height: 48.r,
              width: 48.r,
              decoration: BoxDecoration(
                color: AppColors.primarySoft,
                borderRadius: BorderRadius.circular(16.r),
              ),
              child: Icon(icon, color: AppColors.primary, size: 20.sp),
            ),
            SizedBox(height: 16.h),
            Text(
              title,
              style: AppTextStyles.h3.copyWith(fontSize: 20.sp, height: 1.1),
            ),
            SizedBox(height: 4.h),
            Text(subtitle, style: AppTextStyles.bodySmall),
          ],
        ),
      ),
    );
  }
}

class _TrustedPharmacyCard extends StatelessWidget {
  const _TrustedPharmacyCard({
    required this.image,
    required this.title,
    required this.eta,
    required this.rating,
    required this.onTapVisit,
  });

  final String image;
  final String title;
  final String eta;
  final String rating;
  final VoidCallback onTapVisit;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(12.r),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(28.r),
        boxShadow: <BoxShadow>[
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: <Widget>[
          ClipRRect(
            borderRadius: BorderRadius.circular(18.r),
            child: CachedNetworkImage(
              imageUrl: image,
              width: 58.w,
              height: 64.h,
              fit: BoxFit.cover,
            ),
          ),
          SizedBox(width: 12.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(title,
                    style: AppTextStyles.label.copyWith(fontSize: 16.sp)),
                SizedBox(height: 6.h),
                Text('Rating $rating | $eta', style: AppTextStyles.bodySmall),
              ],
            ),
          ),
          Material(
            color: AppColors.primary,
            borderRadius: BorderRadius.circular(999.r),
            child: InkWell(
              borderRadius: BorderRadius.circular(999.r),
              onTap: onTapVisit,
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 10.h),
                child: Text(
                  'Visit',
                  style: AppTextStyles.label.copyWith(color: Colors.white),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CategoryData {
  const _CategoryData(this.label, this.asset);

  final String label;
  final String asset;
}
