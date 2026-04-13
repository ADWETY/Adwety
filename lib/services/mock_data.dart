import '../models/drug.dart';
import '../models/drug_search_result.dart';
import '../models/inventory.dart';
import '../models/pharmacy.dart';
import '../models/pharmacy_details.dart';
import '../models/user.dart';

class MockData {
  static const UserModel demoUser = UserModel(
    id: 'user-1',
    name: 'Mona Ahmed',
    email: 'mona@adwety.app',
    token: 'mock-jwt-token',
  );

  static const List<PharmacyModel> pharmacies = <PharmacyModel>[
    PharmacyModel(
      id: 'ph-1',
      name: 'BlueCare Pharmacy',
      address: '21 Nile Street, Maadi, Cairo',
      distanceKm: 1.2,
      rating: 4.8,
      latitude: 30.0368,
      longitude: 31.2090,
    ),
    PharmacyModel(
      id: 'ph-2',
      name: 'Teal Health Pharmacy',
      address: '14 Road 9, Dokki, Giza',
      distanceKm: 2.4,
      rating: 4.6,
      latitude: 30.0399,
      longitude: 31.2001,
    ),
    PharmacyModel(
      id: 'ph-3',
      name: 'CityMed Pharmacy',
      address: '7 Abbas El Akkad, Nasr City, Cairo',
      distanceKm: 4.1,
      rating: 4.5,
      latitude: 30.0535,
      longitude: 31.3400,
    ),
  ];

  static const List<DrugModel> drugs = <DrugModel>[
    DrugModel(
      id: 'drug-1',
      name: 'Panadol Extra',
      strength: '500mg',
      form: 'Tablet',
      description: 'Pain reliever and fever reducer.',
    ),
    DrugModel(
      id: 'drug-2',
      name: 'Amoxicillin',
      strength: '500mg',
      form: 'Capsule',
      description: 'Antibiotic used for bacterial infections.',
    ),
    DrugModel(
      id: 'drug-3',
      name: 'Insulin Glargine',
      strength: '100 IU/ml',
      form: 'Injection',
      description: 'Long-acting insulin for diabetes management.',
    ),
    DrugModel(
      id: 'drug-4',
      name: 'Lisinopril',
      strength: '10mg',
      form: 'Tablet',
      description: 'Used for hypertension treatment.',
    ),
    DrugModel(
      id: 'drug-5',
      name: 'Ventolin',
      strength: '100 mcg',
      form: 'Inhaler',
      description: 'Bronchodilator for asthma symptoms.',
    ),
  ];

  static const List<InventoryModel> inventory = <InventoryModel>[
    InventoryModel(
      id: 'inv-1',
      pharmacyId: 'ph-1',
      drugId: 'drug-1',
      price: 46.5,
      quantity: 22,
    ),
    InventoryModel(
      id: 'inv-2',
      pharmacyId: 'ph-1',
      drugId: 'drug-2',
      price: 88.0,
      quantity: 6,
    ),
    InventoryModel(
      id: 'inv-3',
      pharmacyId: 'ph-1',
      drugId: 'drug-3',
      price: 312.0,
      quantity: 0,
    ),
    InventoryModel(
      id: 'inv-4',
      pharmacyId: 'ph-2',
      drugId: 'drug-1',
      price: 44.0,
      quantity: 9,
    ),
    InventoryModel(
      id: 'inv-5',
      pharmacyId: 'ph-2',
      drugId: 'drug-4',
      price: 72.5,
      quantity: 15,
    ),
    InventoryModel(
      id: 'inv-6',
      pharmacyId: 'ph-2',
      drugId: 'drug-5',
      price: 95.0,
      quantity: 4,
    ),
    InventoryModel(
      id: 'inv-7',
      pharmacyId: 'ph-3',
      drugId: 'drug-2',
      price: 90.0,
      quantity: 12,
    ),
    InventoryModel(
      id: 'inv-8',
      pharmacyId: 'ph-3',
      drugId: 'drug-3',
      price: 299.0,
      quantity: 3,
    ),
    InventoryModel(
      id: 'inv-9',
      pharmacyId: 'ph-3',
      drugId: 'drug-4',
      price: 68.0,
      quantity: 0,
    ),
  ];

  static List<DrugSearchResult> searchDrugResults(String query) {
    final String normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery.isEmpty) {
      return <DrugSearchResult>[];
    }

    final Map<String, DrugModel> drugsById = <String, DrugModel>{
      for (final DrugModel drug in drugs) drug.id: drug,
    };
    final Map<String, PharmacyModel> pharmaciesById = <String, PharmacyModel>{
      for (final PharmacyModel pharmacy in pharmacies) pharmacy.id: pharmacy,
    };

    final List<DrugSearchResult> results = <DrugSearchResult>[];

    for (final InventoryModel item in inventory) {
      final DrugModel? drug = drugsById[item.drugId];
      final PharmacyModel? pharmacy = pharmaciesById[item.pharmacyId];

      if (drug == null || pharmacy == null) {
        continue;
      }

      final bool matchesDrug =
          drug.label.toLowerCase().contains(normalizedQuery) ||
              drug.name.toLowerCase().contains(normalizedQuery);

      if (matchesDrug) {
        results.add(
          DrugSearchResult(
            drug: drug,
            pharmacy: pharmacy,
            inventory: item,
          ),
        );
      }
    }

    results.sort((DrugSearchResult a, DrugSearchResult b) {
      final int stockA = a.inventory.isInStock ? 1 : 0;
      final int stockB = b.inventory.isInStock ? 1 : 0;
      final int byStock = stockB.compareTo(stockA);
      if (byStock != 0) {
        return byStock;
      }

      final int byDistance =
          a.pharmacy.distanceKm.compareTo(b.pharmacy.distanceKm);
      if (byDistance != 0) {
        return byDistance;
      }

      return a.inventory.price.compareTo(b.inventory.price);
    });

    return results;
  }

  static List<DrugModel> extractedDrugs() {
    return <DrugModel>[drugs[0], drugs[2], drugs[4]];
  }

  static PharmacyDetailsModel pharmacyDetails(String pharmacyId) {
    final PharmacyModel pharmacy = pharmacies.firstWhere(
      (PharmacyModel item) => item.id == pharmacyId,
      orElse: () => pharmacies.first,
    );

    final Map<String, DrugModel> drugsById = <String, DrugModel>{
      for (final DrugModel drug in drugs) drug.id: drug,
    };

    final List<DrugSearchResult> pharmacyInventory = <DrugSearchResult>[];

    for (final InventoryModel item in inventory) {
      if (item.pharmacyId != pharmacy.id) {
        continue;
      }

      final DrugModel? drug = drugsById[item.drugId];
      if (drug == null) {
        continue;
      }

      pharmacyInventory.add(
        DrugSearchResult(drug: drug, pharmacy: pharmacy, inventory: item),
      );
    }

    pharmacyInventory.sort((DrugSearchResult a, DrugSearchResult b) {
      return a.drug.name.compareTo(b.drug.name);
    });

    return PharmacyDetailsModel(
      pharmacy: pharmacy,
      inventory: pharmacyInventory,
    );
  }
}
