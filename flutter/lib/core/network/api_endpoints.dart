class ApiEndpoints {
  static const String baseUrl = 'https://api.placeholder.adweth.app/v1';

  static const String medicines = '/medicines';
  static const String pharmacies = '/pharmacies';
  static const String profile = '/profile';

  static String medicineDetails(String id) => '$medicines/$id';
  static String pharmacyDetails(String id) => '$pharmacies/$id';
}
