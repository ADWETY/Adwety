import '../../domain/entities/medicine.dart';

class MedicineModel extends Medicine {
  const MedicineModel({
    required super.id,
    required super.name,
    required super.category,
    required super.price,
    required super.stockStatus,
    required super.imageUrl,
    required super.pharmacyName,
  });

  factory MedicineModel.fromJson(Map<String, dynamic> json) {
    return MedicineModel(
      id: json['id'] as String,
      name: json['name'] as String,
      category: json['category'] as String,
      price: (json['price'] as num).toDouble(),
      stockStatus: json['stock_status'] as String,
      imageUrl: json['image_url'] as String,
      pharmacyName: json['pharmacy_name'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'name': name,
      'category': category,
      'price': price,
      'stock_status': stockStatus,
      'image_url': imageUrl,
      'pharmacy_name': pharmacyName,
    };
  }
}
