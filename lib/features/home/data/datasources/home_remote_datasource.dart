import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';

class HomeRemoteDataSource {
  HomeRemoteDataSource(this._apiClient);

  final ApiClient _apiClient;

  Future<List<Map<String, dynamic>>> getTrustedPharmaciesJson() async {
    final dynamic response =
        (await _apiClient.get(ApiEndpoints.pharmacies)).data;

    if (response is List<dynamic>) {
      return response.cast<Map<String, dynamic>>();
    }

    return <Map<String, dynamic>>[];
  }

  Future<List<Map<String, dynamic>>> searchMedicinesJson(String query) async {
    final dynamic response = (await _apiClient.get(
      ApiEndpoints.medicines,
      queryParameters: <String, dynamic>{'q': query},
    ))
        .data;

    if (response is List<dynamic>) {
      return response.cast<Map<String, dynamic>>();
    }

    return <Map<String, dynamic>>[];
  }
}
