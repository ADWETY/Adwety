import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants/app_routes.dart';
import 'adweth_bottom_nav_bar.dart';

class MainShellScaffold extends StatelessWidget {
  const MainShellScaffold({
    required this.child,
    required this.location,
    super.key,
  });

  final Widget child;
  final String location;

  int _locationToIndex(String path) {
    if (path.startsWith(AppRoutes.search) ||
        path.startsWith(AppRoutes.searchResults) ||
        path.startsWith(AppRoutes.pharmacy)) {
      return 1;
    }
    if (path.startsWith(AppRoutes.scan)) {
      return 2;
    }
    if (path.startsWith(AppRoutes.notifications)) {
      return 3;
    }
    if (path.startsWith(AppRoutes.profile)) {
      return 4;
    }
    return 0;
  }

  void _navigateByIndex(BuildContext context, int index) {
    const List<String> tabs = <String>[
      AppRoutes.home,
      AppRoutes.search,
      AppRoutes.scan,
      AppRoutes.notifications,
      AppRoutes.profile,
    ];
    context.go(tabs[index]);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: AdwethBottomNavBar(
        currentIndex: _locationToIndex(location),
        onTap: (int index) => _navigateByIndex(context, index),
      ),
    );
  }
}
