import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../features/scan/presentation/viewmodels/scan_view_model.dart';
import '../../widgets/state_widgets.dart';

class ScanMedicineScreen extends ConsumerWidget {
  const ScanMedicineScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ScanState state = ref.watch(scanViewModelProvider);
    final ScanViewModel notifier = ref.read(scanViewModelProvider.notifier);

    return SafeArea(
      bottom: false,
      child: Padding(
        padding: EdgeInsets.fromLTRB(20.w, 16.h, 20.w, 100.h),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              children: <Widget>[
                Icon(Icons.document_scanner_outlined,
                    color: AppColors.primary, size: 26.sp),
                SizedBox(width: 8.w),
                Text('AI Prescription Scan', style: AppTextStyles.h3),
              ],
            ),
            SizedBox(height: 10.h),
            Text(
              'Mock flow: upload/scan prescription image, extract medicines using AI, then search nearby pharmacies.',
              style: AppTextStyles.body,
            ),
            SizedBox(height: 20.h),
            Container(
              width: double.infinity,
              padding: EdgeInsets.all(20.r),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(18.r),
                border: Border.all(
                  color: AppColors.primary.withValues(alpha: 0.18),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text('Step 1', style: AppTextStyles.label),
                  SizedBox(height: 4.h),
                  Text(
                    'Tap Scan Prescription to run a mocked AI extraction.',
                    style: AppTextStyles.bodySmall,
                  ),
                  SizedBox(height: 14.h),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed:
                          state.isScanning ? null : notifier.scanPrescription,
                      icon: const Icon(Icons.auto_awesome_rounded),
                      label: Text(
                        state.isScanning
                            ? 'Analyzing prescription...'
                            : 'Scan Prescription',
                      ),
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(height: 16.h),
            Expanded(
              child: Builder(
                builder: (BuildContext context) {
                  if (state.isScanning) {
                    return const LoadingStateWidget(
                      message: 'AI is extracting medicines...',
                    );
                  }

                  if (state.errorMessage != null) {
                    return ErrorStateWidget(
                      message: state.errorMessage!,
                      onRetry: notifier.scanPrescription,
                    );
                  }

                  if (!state.hasScanned) {
                    return const EmptyStateWidget(
                      title: 'No scan yet',
                      subtitle: 'Run a mock scan to view extracted medicines.',
                      icon: Icons.receipt_long_rounded,
                    );
                  }

                  if (state.extractedDrugs.isEmpty) {
                    return const EmptyStateWidget(
                      title: 'No medicines detected',
                      subtitle: 'Try another image or run scan again.',
                      icon: Icons.find_in_page_rounded,
                    );
                  }

                  return ListView(
                    children: <Widget>[
                      Text(
                        'Step 2: Extracted Drugs (${state.extractedDrugs.length})',
                        style: AppTextStyles.label,
                      ),
                      SizedBox(height: 10.h),
                      ...state.extractedDrugs.map((drug) {
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
                              Icon(
                                Icons.medication_liquid_rounded,
                                color: AppColors.primary,
                                size: 22.sp,
                              ),
                              SizedBox(width: 10.w),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: <Widget>[
                                    Text(drug.label,
                                        style: AppTextStyles.label),
                                    Text(
                                      '${drug.form} • ${drug.description ?? 'No description'}',
                                      style: AppTextStyles.bodySmall,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                              TextButton(
                                onPressed: () {
                                  context.go(
                                    '${AppRoutes.searchResults}?q=${Uri.encodeComponent(drug.name)}',
                                  );
                                },
                                child: const Text('Search'),
                              ),
                            ],
                          ),
                        );
                      }),
                      SizedBox(height: 10.h),
                      ElevatedButton.icon(
                        onPressed: () {
                          context.go(
                            '${AppRoutes.map}?source=scan&medicine=${Uri.encodeComponent(state.extractedDrugs.first.label)}',
                          );
                        },
                        icon: const Icon(Icons.map_outlined),
                        label: const Text('View Pharmacies on Map'),
                      ),
                      TextButton(
                        onPressed: notifier.reset,
                        child: const Text('Reset Scan'),
                      ),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
