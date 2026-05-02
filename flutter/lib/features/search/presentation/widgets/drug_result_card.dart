import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../models/drug_search_result.dart';

class DrugResultCard extends StatelessWidget {
  const DrugResultCard({
    required this.result,
    required this.onViewPharmacy,
    required this.onViewMap,
    super.key,
  });

  final DrugSearchResult result;
  final VoidCallback onViewPharmacy;
  final VoidCallback onViewMap;

  @override
  Widget build(BuildContext context) {
    final bool inStock = result.inventory.isInStock;

    return Container(
      margin: EdgeInsets.only(bottom: 12.h),
      padding: EdgeInsets.all(14.r),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18.r),
        border: Border.all(
          color: AppColors.border.withValues(alpha: 0.7),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(result.drug.label, style: AppTextStyles.label),
                    SizedBox(height: 4.h),
                    Text(
                      '${result.pharmacy.name} • ${result.pharmacy.distanceKm.toStringAsFixed(1)} km',
                      style: AppTextStyles.bodySmall,
                    ),
                  ],
                ),
              ),
              Container(
                padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
                decoration: BoxDecoration(
                  color: inStock
                      ? AppColors.success.withValues(alpha: 0.14)
                      : AppColors.error.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(999.r),
                ),
                child: Text(
                  inStock ? 'IN STOCK' : 'OUT OF STOCK',
                  style: AppTextStyles.captionCaps.copyWith(
                    color: inStock ? AppColors.success : AppColors.error,
                    letterSpacing: 0.2,
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: 10.h),
          Row(
            children: <Widget>[
              Text(
                'EGP ${result.inventory.price.toStringAsFixed(2)}',
                style: AppTextStyles.h3.copyWith(
                  color: AppColors.primary,
                  fontSize: 18.sp,
                ),
              ),
              const Spacer(),
              OutlinedButton(
                onPressed: onViewMap,
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.border),
                ),
                child: const Text('Map'),
              ),
              SizedBox(width: 8.w),
              ElevatedButton(
                onPressed: onViewPharmacy,
                child: const Text('Details'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
