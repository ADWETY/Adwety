import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

@immutable
class CameraCaptureState {
  const CameraCaptureState({
    this.isInitializing = true,
    this.permissionDenied = false,
    this.capturedImagePath,
    this.errorMessage,
  });

  final bool isInitializing;
  final bool permissionDenied;
  final String? capturedImagePath;
  final String? errorMessage;

  CameraCaptureState copyWith({
    bool? isInitializing,
    bool? permissionDenied,
    String? capturedImagePath,
    String? errorMessage,
    bool clearCapture = false,
    bool clearError = false,
  }) {
    return CameraCaptureState(
      isInitializing: isInitializing ?? this.isInitializing,
      permissionDenied: permissionDenied ?? this.permissionDenied,
      capturedImagePath:
          clearCapture ? null : capturedImagePath ?? this.capturedImagePath,
      errorMessage: clearError ? null : errorMessage ?? this.errorMessage,
    );
  }
}

class CameraCaptureNotifier extends StateNotifier<CameraCaptureState> {
  CameraCaptureNotifier() : super(const CameraCaptureState());

  void setInitializing(bool value) {
    state = state.copyWith(isInitializing: value);
  }

  void setPermissionDenied(bool value) {
    state = state.copyWith(permissionDenied: value, isInitializing: false);
  }

  void setCapturedPath(String path) {
    state = state.copyWith(capturedImagePath: path, clearError: true);
  }

  void clearCapturedImage() {
    state = state.copyWith(clearCapture: true);
  }

  void setError(String message) {
    state = state.copyWith(errorMessage: message, isInitializing: false);
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }
}

final StateNotifierProvider<CameraCaptureNotifier, CameraCaptureState>
    cameraCaptureProvider =
    StateNotifierProvider<CameraCaptureNotifier, CameraCaptureState>(
  (Ref ref) => CameraCaptureNotifier(),
);
