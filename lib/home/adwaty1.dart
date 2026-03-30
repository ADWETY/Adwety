import 'package:flutter/material.dart';

class Adwaty1 extends StatelessWidget {
  const Adwaty1({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FE),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 25), // زيادة البادينج الخارجي
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // --- الترحيب ---
              const Text(
                "Good Morning, nader",
                style: TextStyle(
                  fontSize: 28, // تكبير الخط قليلًا
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2D2E8B),
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                "Ready to manage your health today?",
                style: TextStyle(color: Colors.grey, fontSize: 16),
              ),

              const SizedBox(height: 30),

              // --- شريط البحث (أعرض قليلًا) ---
              _buildSearchBar(),

              const SizedBox(height: 35),

              // --- قسم الحجوزات Recent Reservations ---
              _buildSectionTitle("Recent Reservations"),
              const SizedBox(height: 15),
              // جعلنا الحجوزات تأخذ ارتفاع أكبر
              SizedBox(
                height: 190,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: [
                    _buildReservationCard("Amoxicillin 500mg", "Pharmacy Al-Amal", "Today, 14:00", "\$12.50", true),
                    _buildReservationCard("Vitamin C Complex", "Care Plus Pharmacy", "Tomorrow, 10:30", "\$8.00", false),
                    _buildReservationCard("Amoxicillin 500mg", "Pharmacy Al-Amal", "Today, 14:00", "\$12.50", true),
                    _buildReservationCard("Vitamin C Complex", "Care Plus Pharmacy", "Tomorrow, 10:30", "\$8.00", false),
                  ],
                ),
              ),

              const SizedBox(height: 35),

              // --- قسم الإجراءات السريعة (تحت بعض وعريضة جداً) ---
              _buildSectionTitle("Quick Actions"),
              const SizedBox(height: 20),

              Column(
                children: [
                  _buildLargeActionCard(
                      "Upload Prescription",
                      Icons.camera_alt_outlined,
                      const Color(0xFF2D2E8B),
                      Colors.white,
                      "Quickly scan and send your medical prescription"
                  ),
                  const SizedBox(height: 20),
                  _buildLargeActionCard(
                      "Find Pharmacy",
                      Icons.location_on_outlined,
                      Colors.white,
                      Colors.black,
                      "Locate the nearest open pharmacy around you"
                  ),
                  const SizedBox(height: 20),
                  _buildLargeActionCard(
                      "Order History",
                      Icons.history,
                      Colors.white,
                      Colors.black,
                      "Review and reorder your previous medicines"
                  ),
                ],
              ),

              const SizedBox(height: 40),

              // --- البانر السفلي ---
              _buildTipBanner(),
              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }

  // ودجت العنوان الفرعي
  Widget _buildSectionTitle(String title) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const Icon(Icons.arrow_forward, size: 20, color: Colors.grey),
      ],
    );
  }

  // شريط البحث
  Widget _buildSearchBar() {
    return Container(
      decoration: BoxDecoration(
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 20, offset: const Offset(0, 5))],
      ),
      child: TextField(
        decoration: InputDecoration(
          contentPadding: const EdgeInsets.symmetric(vertical: 18), // جعل البحث أضخم
          hintText: "Search medicines, doctors...",
          prefixIcon: const Icon(Icons.search, color: Colors.indigo),
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
        ),
      ),
    );
  }

  // كارت الإجراءات الضخم (Large Action Card)
  Widget _buildLargeActionCard(String title, IconData icon, Color bgColor, Color textColor, String description) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(25), // زيادة الحشوة الداخلية ليكون الكارت أضخم
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(30), // حواف دائرية أكثر نعومة
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 15, offset: const Offset(0, 8)),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: bgColor == Colors.white ? const Color(0xFFF0F0FF) : Colors.white.withOpacity(0.15),
              borderRadius: BorderRadius.circular(15),
            ),
            child: Icon(icon, color: bgColor == Colors.white ? Colors.indigo : Colors.white, size: 32),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 18),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: TextStyle(color: textColor.withOpacity(0.7), fontSize: 13, height: 1.4),
                ),
              ],
            ),
          ),
          Icon(Icons.chevron_right, color: textColor.withOpacity(0.3)),
        ],
      ),
    );
  }

  // كارت الحجوزات (أعرض)
  Widget _buildReservationCard(String title, String pharmacy, String time, String price, bool isConfirmed) {
    return Container(
      width: 250, // زيادة العرض قليلاً
      margin: const EdgeInsets.only(right: 20, bottom: 10),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(25),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Icon(Icons.medication_liquid, color: Colors.indigo, size: 28),
              if (isConfirmed)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(color: const Color(0xFFE8F5E9), borderRadius: BorderRadius.circular(12)),
                  child: const Text("Active", style: TextStyle(color: Colors.green, fontSize: 12, fontWeight: FontWeight.bold)),
                ),
            ],
          ),
          const Spacer(),
          Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
          Text(pharmacy, style: const TextStyle(color: Colors.grey, fontSize: 14)),
          const SizedBox(height: 15),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(time, style: const TextStyle(fontSize: 13, color: Colors.indigo)),
              Text(price, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            ],
          )
        ],
      ),
    );
  }

  // البانر السفلي
  Widget _buildTipBanner() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(25),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(30),
        gradient: const LinearGradient(colors: [Color(0xFF64B5F6), Color(0xFF1976D2)]),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Health Tip of the Day", style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          const Text("Drinking water regularly helps maintain your energy levels throughout the day.", style: TextStyle(color: Colors.white, fontSize: 15, height: 1.5)),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: () {},
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: Colors.blue[900],
              padding: const EdgeInsets.symmetric(horizontal: 25, vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
            ),
            child: const Text("Learn More"),
          )
        ],
      ),
    );
  }
}