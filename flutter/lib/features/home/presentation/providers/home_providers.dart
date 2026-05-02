import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/services/service_providers.dart';
import '../../data/datasources/home_mock_datasource.dart';
import '../../data/datasources/home_remote_datasource.dart';
import '../../data/repositories/home_repository_impl.dart';
import '../../domain/entities/medicine.dart';
import '../../domain/entities/pharmacy.dart';
import '../../domain/repositories/home_repository.dart';

final Provider<HomeMockDataSource> homeMockDataSourceProvider =
    Provider<HomeMockDataSource>(
  (Ref ref) => HomeMockDataSource(),
);

final Provider<HomeRemoteDataSource> homeRemoteDataSourceProvider =
    Provider<HomeRemoteDataSource>(
  (Ref ref) => HomeRemoteDataSource(ref.read(apiClientProvider)),
);

final Provider<HomeRepository> homeRepositoryProvider =
    Provider<HomeRepository>(
  (Ref ref) => HomeRepositoryImpl(
    mockDataSource: ref.read(homeMockDataSourceProvider),
    remoteDataSource: ref.read(homeRemoteDataSourceProvider),
  ),
);

final FutureProvider<List<Pharmacy>> trustedPharmaciesProvider =
    FutureProvider<List<Pharmacy>>((Ref ref) {
  return ref.read(homeRepositoryProvider).getTrustedPharmacies();
});

final FutureProviderFamily<List<Medicine>, String> medicinesProvider =
    FutureProvider.family<List<Medicine>, String>((Ref ref, String query) {
  return ref.read(homeRepositoryProvider).searchMedicines(query);
});
