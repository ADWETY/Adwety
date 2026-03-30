import 'package:flutter/material.dart';

class Adwaty3 extends StatefulWidget {
  const Adwaty3({super.key});

  @override
  State<Adwaty3> createState() => _Adwaty3State();
}

class _Adwaty3State extends State<Adwaty3> {
  // المتغير المسؤول عن تحديد الزر المختار حالياً
  String selectedFilter = "All";

  @override
  Widget build(BuildContext context) {
    const Color mainBlue = Color(0xFF2D2E8B);
    const Color bgGray = Color(0xFFF8F9FB);
    const Color textGray = Color(0xFF9095A1);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          "Search Results",
          style: TextStyle(color: mainBlue, fontWeight: FontWeight.bold, fontSize: 18),
        ),
        centerTitle: true,
        actions: [
          IconButton(icon: const Icon(Icons.tune, color: Colors.black), onPressed: () {}),
        ],
      ),
      body: Column(
        children: [
          // 1. شريط البحث
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            child: Container(
              decoration: BoxDecoration(
                color: bgGray,
                borderRadius: BorderRadius.circular(15),
              ),
              child: const TextField(
                decoration: InputDecoration(
                  hintText: "Panadol",
                  prefixIcon: Icon(Icons.search, color: textGray),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(vertical: 15),
                ),
              ),
            ),
          ),

          // 2. أزرار الفلاتر التفاعلية
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 5),
            child: Row(
              children: [
                _buildFilterChip("All"),
                _buildFilterChip("In Stock"),
                _buildFilterChip("Tablets"),
                _buildFilterChip("Syrups"),
              ],
            ),
          ),

          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20, vertical: 15),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                "Found 12 results",
                style: TextStyle(color: textGray, fontSize: 14),
              ),
            ),
          ),

          // 3. قائمة الأدوية (كل كارت هو زر أيضاً)
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              children: [
                _buildMedicineCard(
                  name: "Panadol Extra",
                  status: "In Stock",
                  details: "500mg • 24 Tablets",
                  hasVerify: true,
                ),
                _buildMedicineCard(
                  name: "Panadol Advance",
                  status: "In Stock",
                  details: "500mg • 48 Tablets",
                ),
                _buildMedicineCard(
                  name: "Panadol Cold & Flu",
                  status: "Out of Stock",
                  details: "Day & Night • 24 Caplets",
                  isOutOfStock: true,
                ),
                _buildMedicineCard(
                  name: "Paracetamol Generic",
                  status: "In Stock",
                  details: "500mg • 100 Tablets",
                  isCheaper: true,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ودجت زر الفلتر التفاعلي
  Widget _buildFilterChip(String label) {
    bool isSelected = selectedFilter == label;
    return GestureDetector(
      onTap: () {
        setState(() {
          selectedFilter = label;
        });
      },
      child: Container(
        margin: const EdgeInsets.only(right: 10),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF2D2E8B) : const Color(0xFFF1F4F7),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.black54,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  // ودجت كارت الدواء (قابل للضغط)
  Widget _buildMedicineCard({
    required String name,
    required String status,
    required String details,
    bool hasVerify = false,
    bool isOutOfStock = false,
    bool isCheaper = false,
  }) {
    return InkWell(
      onTap: () {
        print("تم اختيار دواء: $name");
      },
      borderRadius: BorderRadius.circular(20),
      child: Container(
        margin: const EdgeInsets.only(bottom: 15),
        padding: const EdgeInsets.all(15),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.black12.withOpacity(0.05)),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 5)),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 70, height: 70,
              decoration: BoxDecoration(color: const Color(0xFFF8F9FB), borderRadius: BorderRadius.circular(15)),
              child: const Icon(Icons.medication_outlined, size: 35, color: Colors.blueGrey),
            ),
            const SizedBox(width: 15),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                      if (hasVerify) const SizedBox(width: 5),
                      if (hasVerify) const Icon(Icons.check_circle, color: Color(0xFF4DD0E1), size: 16),
                    ],
                  ),
                  const SizedBox(height: 5),
                  Row(
                    children: [
                      _statusBadge(status, isOutOfStock),
                      if (isCheaper) const SizedBox(width: 8),
                      if (isCheaper) _statusBadge("Cheaper", false, color: Colors.purple.shade50, textColor: Colors.purple),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(details, style: const TextStyle(color: Colors.black45, fontSize: 12)),
                ],
              ),
            ),
            CircleAvatar(
              backgroundColor: const Color(0xFFF1F4F7),
              radius: 18,
              child: Icon(
                isOutOfStock ? Icons.notifications_none : Icons.add,
                color: isOutOfStock ? Colors.grey : const Color(0xFF2D2E8B),
                size: 20,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _statusBadge(String text, bool isOut, {Color? color, Color? textColor}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color ?? (isOut ? Colors.red.shade50 : Colors.teal.shade50),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: textColor ?? (isOut ? Colors.red : Colors.teal),
          fontSize: 10, fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}