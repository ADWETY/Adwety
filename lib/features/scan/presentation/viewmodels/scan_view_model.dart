import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../models/drug.dart';
import '../../../../services/service_providers.dart';

@immutable
class ScanState {
  const ScanState({
    this.isScanning = false,
    this.errorMessage,
    this.extractedDrugs = const <DrugModel>[],
    this.hasScanned = false,
  });

  final bool isScanning;
  final String? errorMessage;
  final List<DrugModel> extractedDrugs;
  final bool hasScanned;

  ScanState copyWith({
    bool? isScanning,
    String? errorMessage,
    List<DrugModel>? extractedDrugs,
    bool? hasScanned,
    bool clearError = false,
  }) {
    return ScanState(
      isScanning: isScanning ?? this.isScanning,
      errorMessage: clearError ? null : errorMessage ?? this.errorMessage,
      extractedDrugs: extractedDrugs ?? this.extractedDrugs,
      hasScanned: hasScanned ?? this.hasScanned,
    );
  }
}

class ScanViewModel extends StateNotifier<ScanState> {
  ScanViewModel(this._read) : super(const ScanState());

  final Ref _read;

  Future<void> scanPrescription() async {
    state =
        state.copyWith(isScanning: true, clearError: true, hasScanned: true);

    try {
      final List<DrugModel> drugs =
          await _read.read(apiServiceProvider).scanPrescription();

      state = state.copyWith(
        isScanning: false,
        extractedDrugs: drugs,
        hasScanned: true,
      );
    } catch (error) {
      state = state.copyWith(
        isScanning: false,
        errorMessage: error.toString().replaceFirst('Exception: ', ''),
        extractedDrugs: const <DrugModel>[],
        hasScanned: true,
      );
    }
  }

  void reset() {
    state = const ScanState();
  }
}

final StateNotifierProvider<ScanViewModel, ScanState> scanViewModelProvider =
    StateNotifierProvider<ScanViewModel, ScanState>(
  (Ref ref) => ScanViewModel(ref),
);
