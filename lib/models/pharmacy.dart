class PharmacyModel {
  const PharmacyModel({
    required this.id,
    required this.name,
    required this.address,
    required this.distanceKm,
    required this.rating,
    required this.latitude,
    required this.longitude,
  });

  final String id;
  final String name;
  final String address;
  final double distanceKm;
  final double rating;
  final double latitude;
  final double longitude;

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'name': name,
      'address': address,
      'distance_km': distanceKm,
      'rating': rating,
      'latitude': latitude,
      'longitude': longitude,
    };
  }

  factory PharmacyModel.fromJson(Map<String, dynamic> json) {
    return PharmacyModel(
      id: json['id'] as String,
      name: json['name'] as String,
      address: json['address'] as String,
      distanceKm: (json['distance_km'] as num).toDouble(),
      rating: (json['rating'] as num).toDouble(),
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
    );
  }
}
