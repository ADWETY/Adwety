import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../features/pharmacy/presentation/providers/pharmacy_providers.dart';
import '../../models/pharmacy_details.dart';
import '../../widgets/state_widgets.dart';

class PharmacyDetailsScreen extends ConsumerWidget {
  const PharmacyDetailsScreen({
    super.key,
    this.pharmacyId = 'ph-1',
  });

  final String pharmacyId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<PharmacyDetailsModel> detailsAsync =
        ref.watch(pharmacyDetailsProvider(pharmacyId));

    return SafeArea(
      bottom: false,
      child: detailsAsync.when(
        data: (PharmacyDetailsModel details) {
          return ListView(
            padding: EdgeInsets.fromLTRB(20.w, 16.h, 20.w, 100.h),
            children: <Widget>[
              Row(
                children: <Widget>[
                  IconButton(
                    onPressed: () => context.go(AppRoutes.searchResults),
                    icon: const Icon(Icons.arrow_back_ios_new_rounded),
                  ),
                  Expanded(
                    child: Text(
                      details.pharmacy.name,
                      style: AppTextStyles.h3,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              SizedBox(height: 6.h),
              Text(details.pharmacy.address, style: AppTextStyles.body),
              SizedBox(height: 8.h),
              Wrap(
                spacing: 8.w,
                runSpacing: 8.h,
                children: <Widget>[
                  _InfoChip(
                    icon: Icons.star_rounded,
                    text: details.pharmacy.rating.toStringAsFixed(1),
                  ),
                  _InfoChip(
                    icon: Icons.place_outlined,
                    text:
                        '${details.pharmacy.distanceKm.toStringAsFixed(1)} km',
                  ),
                  _InfoChip(
                    icon: Icons.inventory_2_outlined,
                    text: '${details.availableItems} Available Items',
                  ),
                ],
              ),
              SizedBox(height: 18.h),
              Text('Inventory', style: AppTextStyles.h3),
              SizedBox(height: 10.h),
              if (details.inventory.isEmpty)
                const EmptyStateWidget(
                  title: 'No inventory yet',
                  subtitle: 'This pharmacy currently has no listed medicines.',
                  icon: Icons.medication_outlined,
                )
              else
                ...details.inventory.map((item) {
                  return Container(
                    margin: EdgeInsets.only(bottom: 10.h),
                    padding: EdgeInsets.all(14.r),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(14.r),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      children: <Widget>[
                        Container(
                          width: 42.r,
                          height: 42.r,
                          decoration: BoxDecoration(
                            color: AppColors.primarySoft,
                            borderRadius: BorderRadius.circular(10.r),
                          ),
                          child: Icon(
                            Icons.medication_rounded,
                            color: AppColors.primary,
                            size: 22.sp,
                          ),
                        ),
                        SizedBox(width: 10.w),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: <Widget>[
                              Text(item.drug.label, style: AppTextStyles.label),
                              Text(item.drug.form,
                                  style: AppTextStyles.bodySmall),
                            ],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: <Widget>[
                            Text(
                              'EGP ${item.inventory.price.toStringAsFixed(2)}',
                              style: AppTextStyles.label.copyWith(
                                color: AppColors.primary,
                              ),
                            ),
                            Text(
                              item.inventory.isInStock
                                  ? 'IN STOCK'
                                  : 'OUT OF STOCK',
                              style: AppTextStyles.captionCaps.copyWith(
                                color: item.inventory.isInStock
                                    ? AppColors.success
                                    : AppColors.error,
                                letterSpacing: 0.2,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                }),
              SizedBox(height: 12.h),
              ElevatedButton.icon(
                onPressed: () {
                  context.go(
                      '${AppRoutes.map}?medicine=${Uri.encodeComponent('Pharmacy View')}');
                },
                icon: const Icon(Icons.map_outlined),
                label: const Text('View on Map'),
              ),
            ],
          );
        },
        loading: () => const LoadingStateWidget(
          message: 'Loading pharmacy details...',
        ),
        error: (Object error, StackTrace stackTrace) {
          return ErrorStateWidget(
            message: error.toString().replaceFirst('Exception: ', ''),
            onRetry: () => ref.invalidate(pharmacyDetailsProvider(pharmacyId)),
          );
        },
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({
    required this.icon,
    required this.text,
  });

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 6.h),
      decoration: BoxDecoration(
        color: AppColors.surfaceMuted,
        borderRadius: BorderRadius.circular(999.r),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Icon(icon, size: 15.sp, color: AppColors.primary),
          SizedBox(width: 4.w),
          Text(text, style: AppTextStyles.bodySmall),
        ],
      ),
    );
  }
}
