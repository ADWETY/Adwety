class InventoryModel {
  const InventoryModel({
    required this.id,
    required this.pharmacyId,
    required this.drugId,
    required this.price,
    required this.quantity,
  });

  final String id;
  final String pharmacyId;
  final String drugId;
  final double price;
  final int quantity;

  bool get isInStock => quantity > 0;

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'pharmacy_id': pharmacyId,
      'drug_id': drugId,
      'price': price,
      'quantity': quantity,
    };
  }

  factory InventoryModel.fromJson(Map<String, dynamic> json) {
    return InventoryModel(
      id: json['id'] as String,
      pharmacyId: json['pharmacy_id'] as String,
      drugId: json['drug_id'] as String,
      price: (json['price'] as num).toDouble(),
      quantity: json['quantity'] as int,
    );
  }
}
