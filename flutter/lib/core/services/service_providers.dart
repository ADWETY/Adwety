import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../network/api_client.dart';
import 'permission_service.dart';

final Provider<ApiClient> apiClientProvider = Provider<ApiClient>(
  (Ref ref) => ApiClient(),
);

final Provider<PermissionService> permissionServiceProvider =
    Provider<PermissionService>(
  (Ref ref) => PermissionService(),
);
