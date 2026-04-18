import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

@immutable
class AppUiState {
  const AppUiState({
    this.notificationCount = 3,
    this.onboardingIndex = 0,
    this.selectedCategory = 'Scan Medicine',
  });

  final int notificationCount;
  final int onboardingIndex;
  final String selectedCategory;

  AppUiState copyWith({
    int? notificationCount,
    int? onboardingIndex,
    String? selectedCategory,
  }) {
    return AppUiState(
      notificationCount: notificationCount ?? this.notificationCount,
      onboardingIndex: onboardingIndex ?? this.onboardingIndex,
      selectedCategory: selectedCategory ?? this.selectedCategory,
    );
  }
}

class AppUiNotifier extends StateNotifier<AppUiState> {
  AppUiNotifier() : super(const AppUiState());

  void setOnboardingIndex(int value) {
    state = state.copyWith(onboardingIndex: value);
  }

  void setSelectedCategory(String value) {
    state = state.copyWith(selectedCategory: value);
  }

  void clearNotifications() {
    state = state.copyWith(notificationCount: 0);
  }
}

final StateNotifierProvider<AppUiNotifier, AppUiState> appUiProvider =
    StateNotifierProvider<AppUiNotifier, AppUiState>(
  (Ref ref) => AppUiNotifier(),
);
