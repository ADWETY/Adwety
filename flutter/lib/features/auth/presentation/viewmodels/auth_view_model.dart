import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../models/user.dart';
import '../../../../services/service_providers.dart';

@immutable
class AuthState {
  const AuthState({
    this.isLoading = false,
    this.errorMessage,
    this.user,
  });

  final bool isLoading;
  final String? errorMessage;
  final UserModel? user;

  AuthState copyWith({
    bool? isLoading,
    String? errorMessage,
    UserModel? user,
    bool clearError = false,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      errorMessage: clearError ? null : errorMessage ?? this.errorMessage,
      user: user ?? this.user,
    );
  }
}

class AuthViewModel extends StateNotifier<AuthState> {
  AuthViewModel(this._read) : super(const AuthState());

  final Ref _read;

  Future<bool> login({
    required String email,
    required String password,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final UserModel user = await _read
          .read(apiServiceProvider)
          .login(email: email, password: password);

      state = state.copyWith(
        isLoading: false,
        user: user,
        clearError: true,
      );
      return true;
    } catch (error) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: error.toString().replaceFirst('Exception: ', ''),
      );
      return false;
    }
  }

  Future<bool> register({
    required String name,
    required String email,
    required String password,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final UserModel baseUser = await _read
          .read(apiServiceProvider)
          .login(email: email, password: password);

      state = state.copyWith(
        isLoading: false,
        user: baseUser.copyWith(name: name.trim()),
        clearError: true,
      );
      return true;
    } catch (error) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: error.toString().replaceFirst('Exception: ', ''),
      );
      return false;
    }
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }
}

final StateNotifierProvider<AuthViewModel, AuthState> authViewModelProvider =
    StateNotifierProvider<AuthViewModel, AuthState>(
  (Ref ref) => AuthViewModel(ref),
);
