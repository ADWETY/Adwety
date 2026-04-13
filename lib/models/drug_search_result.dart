import 'drug.dart';
import 'inventory.dart';
import 'pharmacy.dart';

class DrugSearchResult {
  const DrugSearchResult({
    required this.drug,
    required this.pharmacy,
    required this.inventory,
  });

  final DrugModel drug;
  final PharmacyModel pharmacy;
  final InventoryModel inventory;
}
