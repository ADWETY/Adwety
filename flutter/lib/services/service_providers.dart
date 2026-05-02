import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'api_service.dart';

final Provider<ApiService> apiServiceProvider = Provider<ApiService>(
  (Ref ref) => ApiService(),
);
