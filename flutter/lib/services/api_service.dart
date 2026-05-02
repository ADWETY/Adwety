import 'dart:async';
import 'dart:math';

import '../models/drug.dart';
import '../models/drug_search_result.dart';
import '../models/pharmacy_details.dart';
import '../models/user.dart';
import 'mock_data.dart';

class ApiService {
  final Random _random = Random();

  Future<void> _simulateDelay({
    int minMs = 650,
    int maxMs = 1400,
  }) async {
    final int range = maxMs - minMs;
    final int delayMs = minMs + _random.nextInt(range + 1);
    await Future<void>.delayed(Duration(milliseconds: delayMs));
  }

  Future<UserModel> login({
    required String email,
    required String password,
  }) async {
    await _simulateDelay();

    if (email.trim().isEmpty || password.trim().isEmpty) {
      throw Exception('Please enter email and password.');
    }

    if (email.toLowerCase().contains('error')) {
      throw Exception('Invalid credentials. Please try again.');
    }

    return MockData.demoUser.copyWith(email: email.trim());
  }

  Future<List<DrugSearchResult>> searchDrug(String query) async {
    await _simulateDelay();

    if (query.trim().toLowerCase() == 'error') {
      throw Exception('Search service is temporarily unavailable.');
    }

    return MockData.searchDrugResults(query);
  }

  Future<List<DrugModel>> scanPrescription() async {
    await _simulateDelay(minMs: 1400, maxMs: 2600);

    if (_random.nextInt(25) == 0) {
      throw Exception('AI scanner could not read the prescription. Try again.');
    }

    return MockData.extractedDrugs();
  }

  Future<PharmacyDetailsModel> getPharmacyDetails(String pharmacyId) async {
    await _simulateDelay();

    return MockData.pharmacyDetails(pharmacyId);
  }
}
