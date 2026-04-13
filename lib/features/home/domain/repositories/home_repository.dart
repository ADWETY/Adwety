import '../entities/medicine.dart';
import '../entities/pharmacy.dart';

abstract class HomeRepository {
  Future<List<Pharmacy>> getTrustedPharmacies();

  Future<List<Medicine>> searchMedicines(String query);
}
