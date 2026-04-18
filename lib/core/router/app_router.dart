import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../features/screens/edit_profile_screen.dart';
import '../../features/screens/home_screen.dart';
import '../../features/screens/login_screen.dart';
import '../../features/screens/map_screen.dart';
import '../../features/screens/notifications_screen.dart';
import '../../features/screens/onboarding_screen.dart';
import '../../features/screens/pharmacy_details_screen.dart';
import '../../features/screens/profile_screen.dart';
import '../../features/screens/register_screen.dart';
import '../../features/screens/scan_medicine_screen.dart';
import '../../features/screens/search_screen.dart';
import '../../features/screens/search_results_screen.dart';
import '../../features/screens/splash_screen.dart';
import '../../features/widgets/main_shell_scaffold.dart';
import '../constants/app_routes.dart';

class AppRouter {
  static final GlobalKey<NavigatorState> _rootNavigatorKey =
      GlobalKey<NavigatorState>();

  static final GoRouter router = GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: AppRoutes.splash,
    routes: <RouteBase>[
      GoRoute(
        path: AppRoutes.splash,
        builder: (BuildContext context, GoRouterState state) =>
            const SplashScreen(),
      ),
      GoRoute(
        path: AppRoutes.onboarding,
        builder: (BuildContext context, GoRouterState state) =>
            const OnboardingScreen(),
      ),
      GoRoute(
        path: AppRoutes.login,
        builder: (BuildContext context, GoRouterState state) =>
            const LoginScreen(),
      ),
      GoRoute(
        path: AppRoutes.register,
        builder: (BuildContext context, GoRouterState state) =>
            const RegisterScreen(),
      ),
      ShellRoute(
        builder: (BuildContext context, GoRouterState state, Widget child) {
          return MainShellScaffold(location: state.uri.path, child: child);
        },
        routes: <RouteBase>[
          GoRoute(
            path: AppRoutes.home,
            builder: (BuildContext context, GoRouterState state) =>
                const HomeScreen(),
          ),
          GoRoute(
            path: AppRoutes.search,
            builder: (BuildContext context, GoRouterState state) =>
                const SearchScreen(),
          ),
          GoRoute(
            path: AppRoutes.searchResults,
            builder: (BuildContext context, GoRouterState state) =>
                SearchResultsScreen(
                  initialQuery: state.uri.queryParameters['q'] ?? '',
                ),
          ),
          GoRoute(
            path: AppRoutes.scan,
            builder: (BuildContext context, GoRouterState state) =>
                const ScanMedicineScreen(),
          ),
          GoRoute(
            path: AppRoutes.notifications,
            builder: (BuildContext context, GoRouterState state) =>
                const NotificationsScreen(),
          ),
          GoRoute(
            path: AppRoutes.profile,
            builder: (BuildContext context, GoRouterState state) =>
                const ProfileScreen(),
          ),
          GoRoute(
            path: AppRoutes.pharmacy,
            builder: (BuildContext context, GoRouterState state) =>
                PharmacyDetailsScreen(
                  pharmacyId: state.uri.queryParameters['id'] ?? 'ph-1',
                ),
          ),
        ],
      ),
      GoRoute(
        path: AppRoutes.map,
        builder: (BuildContext context, GoRouterState state) => MapScreen(
          medicineName: state.uri.queryParameters['medicine'],
          fromScan: state.uri.queryParameters['source'] == 'scan',
        ),
      ),
      GoRoute(
        path: AppRoutes.editProfile,
        builder: (BuildContext context, GoRouterState state) =>
            const EditProfileScreen(),
      ),
    ],
  );
}
