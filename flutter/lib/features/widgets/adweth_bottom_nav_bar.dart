import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/state/app_ui_state.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';

class AdwethBottomNavBar extends ConsumerWidget {
  const AdwethBottomNavBar({
    required this.currentIndex,
    required this.onTap,
    super.key,
  });

  final int currentIndex;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AppUiState appState = ref.watch(appUiProvider);
    final List<_BottomItemData> items = <_BottomItemData>[
      const _BottomItemData(label: 'Home', icon: Icons.home_outlined),
      const _BottomItemData(label: 'Search', icon: Icons.search_rounded),
      const _BottomItemData(label: 'Scan', icon: Icons.qr_code_scanner_rounded),
      const _BottomItemData(
          label: 'Alerts', icon: Icons.notifications_none_rounded),
      const _BottomItemData(
          label: 'Profile', icon: Icons.person_outline_rounded),
    ];

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28.r)),
        boxShadow: <BoxShadow>[
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 18,
            offset: const Offset(0, -6),
          ),
        ],
      ),
      child: Padding(
        padding: EdgeInsets.fromLTRB(8.w, 10.h, 8.w, 12.h),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: List<Widget>.generate(items.length, (int index) {
            final bool selected = currentIndex == index;
            return InkWell(
              borderRadius: BorderRadius.circular(20.r),
              onTap: () => onTap(index),
              child: SizedBox(
                width: 66.w,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: <Widget>[
                    Stack(
                      clipBehavior: Clip.none,
                      children: <Widget>[
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 220),
                          padding: EdgeInsets.symmetric(
                            horizontal: 10.w,
                            vertical: 8.h,
                          ),
                          decoration: BoxDecoration(
                            color: selected
                                ? AppColors.primary.withValues(alpha: 0.12)
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(14.r),
                          ),
                          child: Icon(
                            items[index].icon,
                            size: 20.sp,
                            color: selected
                                ? AppColors.primary
                                : AppColors.textMuted,
                          ),
                        ),
                        if (index == 3 && appState.notificationCount > 0)
                          Positioned(
                            right: -2,
                            top: -2,
                            child: Container(
                              height: 8.r,
                              width: 8.r,
                              decoration: const BoxDecoration(
                                color: AppColors.error,
                                shape: BoxShape.circle,
                              ),
                            ),
                          ),
                      ],
                    ),
                    SizedBox(height: 4.h),
                    Text(
                      items[index].label,
                      style: AppTextStyles.captionCaps.copyWith(
                        color:
                            selected ? AppColors.primary : AppColors.textMuted,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
        ),
      ),
    );
  }
}

class _BottomItemData {
  const _BottomItemData({required this.label, required this.icon});

  final String label;
  final IconData icon;
}
