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
import '../widgets/adweth_primary_button.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  late final PageController _controller;

  final List<_OnboardingData> _pages = <_OnboardingData>[
    const _OnboardingData(
      title: 'Search Medicine',
      description:
          'Instantly browse a vast catalog of pharmaceutical products with detailed information at your fingertips.',
      iconAsset: AppAssets.iconPill,
      ambientColor: Color(0x1A006D43),
    ),
    const _OnboardingData(
      title: 'Find Pharmacies',
      description:
          'Locate the nearest open pharmacies in real-time. We bridge the distance between you and your health needs.',
      iconAsset: AppAssets.iconPin,
      ambientColor: Color(0x1AB9EBCA),
    ),
    const _OnboardingData(
      title: 'Compare Prices',
      description:
          'Save more on every purchase. We compare prices across all local pharmacies to ensure you get the best deal.',
      iconAsset: AppAssets.iconShield,
      ambientColor: Color(0x26006D43),
    ),
  ];

  @override
  void initState() {
    super.initState();
    _controller = PageController();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _nextPage(AppUiState state) {
    if (state.onboardingIndex == _pages.length - 1) {
      context.go(AppRoutes.login);
      return;
    }
    _controller.nextPage(
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    final AppUiState state = ref.watch(appUiProvider);
    final AppUiNotifier notifier = ref.read(appUiProvider.notifier);

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 24.w),
          child: Column(
            children: <Widget>[
              SizedBox(height: 12.h),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: <Widget>[
                  Text(
                    'ADWETY',
                    style: AppTextStyles.brand.copyWith(fontSize: 24.sp),
                  ),
                  TextButton(
                    onPressed: () => context.go(AppRoutes.login),
                    child: Text(
                      'SKIP',
                      style: AppTextStyles.label.copyWith(
                        color: AppColors.textSecondary,
                        letterSpacing: 0.7,
                      ),
                    ),
                  ),
                ],
              ),
              SizedBox(height: 18.h),
              Expanded(
                child: PageView.builder(
                  controller: _controller,
                  onPageChanged: notifier.setOnboardingIndex,
                  itemCount: _pages.length,
                  itemBuilder: (_, int index) {
                    final _OnboardingData page = _pages[index];
                    return _OnboardingPage(data: page);
                  },
                ),
              ),
              SizedBox(height: 16.h),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List<Widget>.generate(_pages.length, (int index) {
                  final bool selected = index == state.onboardingIndex;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: EdgeInsets.symmetric(horizontal: 4.w),
                    height: 8.h,
                    width: selected ? 32.w : 8.w,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(999.r),
                      color: selected ? AppColors.primary : AppColors.border,
                    ),
                  );
                }),
              ),
              SizedBox(height: 24.h),
              AdwethPrimaryButton(
                label: state.onboardingIndex == _pages.length - 1
                    ? 'Get Started'
                    : 'Next',
                onPressed: () => _nextPage(state),
              ),
              SizedBox(height: 28.h),
            ],
          ),
        ),
      ),
    );
  }
}

class _OnboardingPage extends StatelessWidget {
  const _OnboardingPage({required this.data});

  final _OnboardingData data;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: <Widget>[
        SizedBox(height: 14.h),
        Expanded(
          child: Center(
            child: Container(
              padding: EdgeInsets.all(43.r),
              decoration: BoxDecoration(
                color: data.ambientColor,
                borderRadius: BorderRadius.circular(999.r),
              ),
              child: Stack(
                clipBehavior: Clip.none,
                children: <Widget>[
                  Container(
                    padding: EdgeInsets.all(60.r),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(32.r),
                      boxShadow: <BoxShadow>[
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.06),
                          blurRadius: 32,
                          offset: const Offset(0, 12),
                        ),
                      ],
                    ),
                    child: SvgPicture.asset(
                      data.iconAsset,
                      width: 72.w,
                      height: 72.w,
                    ),
                  ),
                  Positioned(
                    right: -16.w,
                    top: -16.h,
                    child: Container(
                      height: 50.r,
                      width: 50.r,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18.r),
                        boxShadow: <BoxShadow>[
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.08),
                            blurRadius: 22,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Icon(
                        Icons.search,
                        color: AppColors.primary,
                        size: 18.sp,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        Text(data.title, style: AppTextStyles.h1, textAlign: TextAlign.center),
        SizedBox(height: 12.h),
        Text(
          data.description,
          style: AppTextStyles.body,
          textAlign: TextAlign.center,
        ),
        SizedBox(height: 20.h),
      ],
    );
  }
}

class _OnboardingData {
  const _OnboardingData({
    required this.title,
    required this.description,
    required this.iconAsset,
    required this.ambientColor,
  });

  final String title;
  final String description;
  final String iconAsset;
  final Color ambientColor;
}
