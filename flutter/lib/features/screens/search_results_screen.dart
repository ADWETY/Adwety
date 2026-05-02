import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants/app_routes.dart';
import '../../core/theme/app_text_styles.dart';
import '../../features/search/presentation/viewmodels/search_view_model.dart';
import '../../features/search/presentation/widgets/drug_result_card.dart';
import '../../widgets/state_widgets.dart';

class SearchResultsScreen extends ConsumerStatefulWidget {
  const SearchResultsScreen({
    super.key,
    this.initialQuery = '',
  });

  final String initialQuery;

  @override
  ConsumerState<SearchResultsScreen> createState() =>
      _SearchResultsScreenState();
}

class _SearchResultsScreenState extends ConsumerState<SearchResultsScreen> {
  late final TextEditingController _searchController;

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController(text: widget.initialQuery);

    if (widget.initialQuery.trim().isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref
            .read(searchViewModelProvider.notifier)
            .submitQuery(widget.initialQuery);
      });
    }
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
        padding: EdgeInsets.fromLTRB(20.w, 14.h, 20.w, 100.h),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              children: <Widget>[
                IconButton(
                  onPressed: () => context.go(AppRoutes.search),
                  icon: const Icon(Icons.arrow_back_ios_new_rounded),
                ),
                Text('Search Results', style: AppTextStyles.h3),
              ],
            ),
            SizedBox(height: 6.h),
            TextField(
              controller: _searchController,
              onChanged: notifier.onQueryChanged,
              onSubmitted: notifier.submitQuery,
              decoration: const InputDecoration(
                hintText: 'Search medicine name',
                prefixIcon: Icon(Icons.search_rounded),
              ),
            ),
            SizedBox(height: 12.h),
            Expanded(
              child: Builder(
                builder: (BuildContext context) {
                  if (state.isLoading) {
                    return const LoadingStateWidget(
                      message: 'Loading results...',
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
                      title: 'No query entered',
                      subtitle: 'Type a medicine name to see pharmacies.',
                    );
                  }

                  if (state.results.isEmpty) {
                    return const EmptyStateWidget(
                      title: 'No matches found',
                      subtitle: 'Try another medicine or check spelling.',
                    );
                  }

                  return ListView(
                    children: <Widget>[
                      Text(
                        '${state.results.length} pharmacies matched',
                        style: AppTextStyles.label,
                      ),
                      SizedBox(height: 8.h),
                      ...state.results.map((result) {
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
