class HomeMockDataSource {
  List<Map<String, dynamic>> getTrustedPharmaciesJson() {
    return <Map<String, dynamic>>[
      <String, dynamic>{
        'id': 'ph-1',
        'name': 'Green Life Pharmacy',
        'distance_km': 2.1,
        'rating': 4.9,
        'image_url':
            'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80',
        'is_featured': true,
      },
      <String, dynamic>{
        'id': 'ph-2',
        'name': 'MediCare Center',
        'distance_km': 1.2,
        'rating': 4.7,
        'image_url':
            'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=600&q=80',
        'is_featured': false,
      },
    ];
  }

  List<Map<String, dynamic>> searchMedicinesJson(String query) {
    final List<Map<String, dynamic>> list = <Map<String, dynamic>>[
      <String, dynamic>{
        'id': 'med-1',
        'name': 'Panadol Extra (500mg)',
        'category': 'Pain Relief',
        'price': 345.0,
        'stock_status': 'IN STOCK',
        'image_url':
            'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80',
        'pharmacy_name': 'El Eaby Pharmacy',
      },
      <String, dynamic>{
        'id': 'med-2',
        'name': 'Panadol Extra (500mg)',
        'category': 'Pain Relief',
        'price': 348.5,
        'stock_status': 'IN STOCK',
        'image_url':
            'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=600&q=80',
        'pharmacy_name': 'Seif Pharmacy',
      },
      <String, dynamic>{
        'id': 'med-3',
        'name': 'Panadol Extra (500mg)',
        'category': 'Pain Relief',
        'price': 345.0,
        'stock_status': 'OUT OF STOCK',
        'image_url':
            'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&q=80',
        'pharmacy_name': 'Misr Pharmacy',
      },
      <String, dynamic>{
        'id': 'med-4',
        'name': 'Panadol Extra (500mg)',
        'category': 'Pain Relief',
        'price': 340.0,
        'stock_status': 'IN STOCK',
        'image_url':
            'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&q=80',
        'pharmacy_name': 'Health Care Center',
      },
    ];

    final String normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery.isEmpty) {
      return list;
    }

    return list
        .where(
          (Map<String, dynamic> item) =>
              (item['name'] as String).toLowerCase().contains(normalizedQuery),
        )
        .toList();
  }
}
