class Medicine {
  const Medicine({
    required this.id,
    required this.name,
    required this.category,
    required this.price,
    required this.stockStatus,
    required this.imageUrl,
    required this.pharmacyName,
  });

  final String id;
  final String name;
  final String category;
  final double price;
  final String stockStatus;
  final String imageUrl;
  final String pharmacyName;

  bool get isInStock => stockStatus == 'IN STOCK';
}
