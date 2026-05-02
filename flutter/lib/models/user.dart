class UserModel {
  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    this.token,
  });

  final String id;
  final String name;
  final String email;
  final String? token;

  UserModel copyWith({
    String? id,
    String? name,
    String? email,
    String? token,
  }) {
    return UserModel(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      token: token ?? this.token,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'id': id,
      'name': name,
      'email': email,
      'token': token,
    };
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      token: json['token'] as String?,
    );
  }
}
