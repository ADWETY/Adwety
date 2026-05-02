import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants/app_routes.dart';
import '../../core/theme/app_text_styles.dart';
import '../../features/search/presentation/viewmodels/search_view_model.dart';
import '../../features/search/presentation/widgets/drug_result_card.dart';
import '../../widgets/state_widgets.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  late final TextEditingController _searchController;

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final SearchState state = ref.watch(searchViewModelProvider);
    final SearchViewModel notifier = ref.read(searchViewModelProvider.notifier);

    return SafeArea(
      bottom: false,
      child: Padding(
        padding: EdgeInsets.fromLTRB(20.w, 16.h, 20.w, 100.h),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text('Search Medicines', style: AppTextStyles.h1),
            SizedBox(height: 8.h),
            Text(
              'Find medicine availability across nearby pharmacies.',
              style: AppTextStyles.body,
            ),
            SizedBox(height: 14.h),
            TextField(
              controller: _searchController,
              onChanged: notifier.onQueryChanged,
              textInputAction: TextInputAction.search,
              onSubmitted: notifier.submitQuery,
              decoration: const InputDecoration(
                hintText: 'Type drug name, e.g. Panadol',
                prefixIcon: Icon(Icons.search_rounded),
              ),
            ),
            SizedBox(height: 12.h),
            Wrap(
              spacing: 8.w,
              runSpacing: 8.h,
              children: <String>[
                'Panadol',
                'Amoxicillin',
                'Insulin',
                'Ventolin',
              ].map((String chipText) {
                return ActionChip(
                  label: Text(chipText),
                  onPressed: () {
                    _searchController.text = chipText;
                    notifier.submitQuery(chipText);
                  },
                );
              }).toList(),
            ),
            SizedBox(height: 14.h),
            Expanded(
              child: Builder(
                builder: (BuildContext context) {
                  if (state.isLoading) {
                    return const LoadingStateWidget(
                      message: 'Searching pharmacies...',
                    );
                  }

                  if (state.errorMessage != null) {
                    return ErrorStateWidget(
                      message: state.errorMessage!,
                      onRetry: () => notifier.submitQuery(state.query),
                    );
                  }

                  if (state.query.trim().isEmpty && !state.hasSearched) {
                    return const EmptyStateWidget(
                      title: 'Start typing to search',
                      subtitle:
                          'Search by medicine name and we will show nearby stock.',
                    );
                  }

                  if (state.results.isEmpty) {
                    return const EmptyStateWidget(
                      title: 'No results found',
                      subtitle: 'Try another medicine name or broader keyword.',
                    );
                  }

                  final int previewCount =
                      state.results.length > 3 ? 3 : state.results.length;

                  return ListView(
                    children: <Widget>[
                      Text(
                        '${state.results.length} results found',
                        style: AppTextStyles.label,
                      ),
                      SizedBox(height: 8.h),
                      ...state.results.take(previewCount).map((result) {
                        return DrugResultCard(
                          result: result,
                          onViewPharmacy: () {
                            context.go(
                              '${AppRoutes.pharmacy}?id=${result.pharmacy.id}',
                            );
                          },
                          onViewMap: () {
                            context.go(
                              '${AppRoutes.map}?medicine=${Uri.encodeComponent(result.drug.label)}',
                            );
                          },
                        );
                      }),
                      if (state.results.length > previewCount)
                        Padding(
                          padding: EdgeInsets.only(top: 8.h),
                          child: ElevatedButton.icon(
                            onPressed: () {
                              context.go(
                                '${AppRoutes.searchResults}?q=${Uri.encodeComponent(state.query)}',
                              );
                            },
                            icon: const Icon(Icons.list_alt_rounded),
                            label: const Text('View all results'),
                          ),
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
