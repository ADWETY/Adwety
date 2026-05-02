import 'drug_search_result.dart';
import 'pharmacy.dart';

class PharmacyDetailsModel {
  const PharmacyDetailsModel({
    required this.pharmacy,
    required this.inventory,
  });

  final PharmacyModel pharmacy;
  final List<DrugSearchResult> inventory;

  int get availableItems {
    return inventory
        .where((DrugSearchResult item) => item.inventory.isInStock)
        .length;
  }
}
