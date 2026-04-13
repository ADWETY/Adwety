class Pharmacy {
  const Pharmacy({
    required this.id,
    required this.name,
    required this.distanceKm,
    required this.rating,
    required this.imageUrl,
    this.isFeatured = false,
  });

  final String id;
  final String name;
  final double distanceKm;
  final double rating;
  final String imageUrl;
  final bool isFeatured;
}
