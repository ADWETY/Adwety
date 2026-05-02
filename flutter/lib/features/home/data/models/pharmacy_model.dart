import '../../domain/entities/pharmacy.dart';

class PharmacyModel extends Pharmacy {
  const PharmacyModel({
    required super.id,
    required super.name,
    required super.distanceKm,
    required super.rating,
    required super.imageUrl,
    super.isFeatured,
  });

  factory PharmacyModel.fromJson(Map<String, dynamic> json) {
    return PharmacyModel(
      id: json['id'] as String,
      name: json['name'] as String,
      distanceKm: (json['distance_km'] as num).toDouble(),
      rating: (json['rating'] as num).toDouble(),
      imageUrl: json['image_url'] as String,
      isFeatured: json['is_featured'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'name': name,
      'distance_km': distanceKm,
      'rating': rating,
      'image_url': imageUrl,
      'is_featured': isFeatured,
    };
  }
}
