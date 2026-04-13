import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../models/drug_search_result.dart';
import '../../../../services/service_providers.dart';

@immutable
class SearchState {
  const SearchState({
    this.query = '',
    this.isLoading = false,
    this.errorMessage,
    this.results = const <DrugSearchResult>[],
    this.hasSearched = false,
  });

  final String query;
  final bool isLoading;
  final String? errorMessage;
  final List<DrugSearchResult> results;
  final bool hasSearched;

  SearchState copyWith({
    String? query,
    bool? isLoading,
    String? errorMessage,
    List<DrugSearchResult>? results,
    bool? hasSearched,
    bool clearError = false,
  }) {
    return SearchState(
      query: query ?? this.query,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: clearError ? null : errorMessage ?? this.errorMessage,
      results: results ?? this.results,
      hasSearched: hasSearched ?? this.hasSearched,
    );
  }
}

class SearchViewModel extends StateNotifier<SearchState> {
  SearchViewModel(this._read) : super(const SearchState());

  final Ref _read;
  Timer? _debounce;

  void onQueryChanged(String value) {
    final String query = value.trim();

    state = state.copyWith(query: value, clearError: true);
    _debounce?.cancel();

    if (query.isEmpty) {
      state = const SearchState();
      return;
    }

    _debounce = Timer(const Duration(milliseconds: 500), () {
      submitQuery(value);
    });
  }

  Future<void> submitQuery(String value) async {
    final String query = value.trim();

    if (query.isEmpty) {
      state = const SearchState();
      return;
    }

    state = state.copyWith(
      query: query,
      isLoading: true,
      clearError: true,
      hasSearched: true,
    );

    try {
      final List<DrugSearchResult> results =
          await _read.read(apiServiceProvider).searchDrug(query);

      state = state.copyWith(
        isLoading: false,
        results: results,
        hasSearched: true,
      );
    } catch (error) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: error.toString().replaceFirst('Exception: ', ''),
        results: const <DrugSearchResult>[],
        hasSearched: true,
      );
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }
}

final StateNotifierProvider<SearchViewModel, SearchState>
    searchViewModelProvider =
    StateNotifierProvider<SearchViewModel, SearchState>(
  (Ref ref) => SearchViewModel(ref),
);
