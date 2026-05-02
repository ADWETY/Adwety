import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';

const LatLng _defaultMapCenter = LatLng(30.0444, 31.2357);

@immutable
class MapViewState {
  const MapViewState({
    this.isLoading = false,
    this.permissionDenied = false,
    this.currentPosition,
    this.center = _defaultMapCenter,
    this.errorMessage,
  });

  final bool isLoading;
  final bool permissionDenied;
  final Position? currentPosition;
  final LatLng center;
  final String? errorMessage;

  MapViewState copyWith({
    bool? isLoading,
    bool? permissionDenied,
    Position? currentPosition,
    LatLng? center,
    String? errorMessage,
    bool clearError = false,
  }) {
    return MapViewState(
      isLoading: isLoading ?? this.isLoading,
      permissionDenied: permissionDenied ?? this.permissionDenied,
      currentPosition: currentPosition ?? this.currentPosition,
      center: center ?? this.center,
      errorMessage: clearError ? null : errorMessage ?? this.errorMessage,
    );
  }
}

class MapViewNotifier extends StateNotifier<MapViewState> {
  MapViewNotifier() : super(const MapViewState());

  void setLoading(bool value) {
    state = state.copyWith(isLoading: value);
  }

  void setPermissionDenied(bool value) {
    state = state.copyWith(
      permissionDenied: value,
      isLoading: false,
      currentPosition: value ? null : state.currentPosition,
    );
  }

  void setCurrentPosition(Position position) {
    state = state.copyWith(
      currentPosition: position,
      center: LatLng(position.latitude, position.longitude),
      permissionDenied: false,
      isLoading: false,
      clearError: true,
    );
  }

  void setError(String message) {
    state = state.copyWith(errorMessage: message, isLoading: false);
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }
}

final StateNotifierProvider<MapViewNotifier, MapViewState> mapViewProvider =
    StateNotifierProvider<MapViewNotifier, MapViewState>(
  (Ref ref) => MapViewNotifier(),
);
