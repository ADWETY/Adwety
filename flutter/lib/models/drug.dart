class DrugModel {
  const DrugModel({
    required this.id,
    required this.name,
    required this.strength,
    required this.form,
    this.description,
  });

  final String id;
  final String name;
  final String strength;
  final String form;
  final String? description;

  String get label => '$name $strength';

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'name': name,
      'strength': strength,
      'form': form,
      'description': description,
    };
  }

  factory DrugModel.fromJson(Map<String, dynamic> json) {
    return DrugModel(
      id: json['id'] as String,
      name: json['name'] as String,
      strength: json['strength'] as String,
      form: json['form'] as String,
      description: json['description'] as String?,
    );
  }
}
