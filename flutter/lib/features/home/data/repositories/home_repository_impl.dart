import '../../domain/entities/medicine.dart';
import '../../domain/entities/pharmacy.dart';
import '../../domain/repositories/home_repository.dart';
import '../datasources/home_mock_datasource.dart';
import '../datasources/home_remote_datasource.dart';
import '../models/medicine_model.dart';
import '../models/pharmacy_model.dart';

class HomeRepositoryImpl implements HomeRepository {
  HomeRepositoryImpl({
    required HomeMockDataSource mockDataSource,
    HomeRemoteDataSource? remoteDataSource,
  })  : _mockDataSource = mockDataSource,
        _remoteDataSource = remoteDataSource;

  final HomeMockDataSource _mockDataSource;
  final HomeRemoteDataSource? _remoteDataSource;

  @override
  Future<List<Pharmacy>> getTrustedPharmacies() async {
    // Keep app fully functional offline using mock data.
    final List<Map<String, dynamic>> json =
        _mockDataSource.getTrustedPharmaciesJson();
    return json.map(PharmacyModel.fromJson).toList();
  }

  @override
  Future<List<Medicine>> searchMedicines(String query) async {
    // Placeholder for backend migration: switch to remote data source when endpoint is ready.
    final List<Map<String, dynamic>> json =
        _mockDataSource.searchMedicinesJson(query);

    if (json.isEmpty && _remoteDataSource != null) {
      final List<Map<String, dynamic>> remoteJson =
          await _remoteDataSource.searchMedicinesJson(query);
      return remoteJson.map(MedicineModel.fromJson).toList();
    }

    return json.map(MedicineModel.fromJson).toList();
  }
}
