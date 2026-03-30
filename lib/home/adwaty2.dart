import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';

class Adwaty2 extends StatefulWidget {
  const Adwaty2({super.key});

  @override
  State<Adwaty2> createState() => _Adwaty2State();
}

class _Adwaty2State extends State<Adwaty2> {
  CameraController? _controller;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    _setupCamera();
  }

  Future<void> _setupCamera() async {
    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) return;
      _controller = CameraController(cameras[0], ResolutionPreset.high, enableAudio: false);
      await _controller!.initialize();
      if (!mounted) return;
      setState(() { _isInitialized = true; });
    } catch (e) {
      debugPrint("Camera Error: $e");
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // الألوان
    const Color accentTeal = Color(0xFF4DD0E1);

    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              child: ConstrainedBox(
                constraints: BoxConstraints(minHeight: constraints.maxHeight),
                child: IntrinsicHeight(
                  child: Stack(
                    children: [
                      // 1. بث الكاميرا (خلفية)
                      if (_isInitialized && _controller != null)
                        Positioned.fill(child: CameraPreview(_controller!))
                      else
                        const Center(child: CircularProgressIndicator(color: accentTeal)),

                      // 2. واجهة المستخدم (Overlay)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        child: Column(
                          children: [
                            // الجزء العلوي
                            _buildHeader(context),

                            const SizedBox(height: 10),
                            _buildInstructionChip(),

                            const Spacer(flex: 1),

                            // الإطار (تم تعديل الـ AspectRatio ليكون 0.85 ليعطي مساحة أكبر)
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 50),
                              child: AspectRatio(
                                aspectRatio: 0.85,
                                child: Container(
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(25),
                                    border: Border.all(color: accentTeal, width: 2),
                                  ),
                                ),
                              ),
                            ),

                            const Spacer(flex: 1),

                            // نص التنبيه السفلي
                            const Padding(
                              padding: EdgeInsets.symmetric(horizontal: 40),
                              child: Text(
                                "Ensure good lighting and avoid reflections for better AI detection.",
                                textAlign: TextAlign.center,
                                style: TextStyle(color: Colors.white54, fontSize: 11),
                              ),
                            ),

                            const SizedBox(height: 15),

                            // لوحة التحكم السفلية (تم تصغير الـ Padding الداخلي)
                            _buildBottomControls(),

                            const SizedBox(height: 5),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  // --- دوال بناء الواجهة ---

  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 15),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _iconButton(Icons.arrow_back, () => Navigator.pop(context)),
          const Text("Scan Prescription", style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
          _iconButton(Icons.help_outline, () {}),
        ],
      ),
    );
  }

  Widget _buildInstructionChip() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 6),
      decoration: BoxDecoration(color: Colors.black45, borderRadius: BorderRadius.circular(20)),
      child: const Text("Align prescription within frame", style: TextStyle(color: Colors.white70, fontSize: 12)),
    );
  }

  Widget _buildBottomControls() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 25),
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 20),
      decoration: BoxDecoration(color: const Color(0xFFF2F4F7), borderRadius: BorderRadius.circular(35)),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _actionBtn(Icons.image_outlined, "Gallery"),
          _captureBtn(),
          _actionBtn(Icons.flash_on, "Flash"),
        ],
      ),
    );
  }

  Widget _iconButton(IconData icon, VoidCallback onTap) {
    return IconButton(
      onPressed: onTap,
      icon: Container(
        padding: const EdgeInsets.all(8),
        decoration: const BoxDecoration(color: Colors.white12, shape: BoxShape.circle),
        child: Icon(icon, color: Colors.white, size: 20),
      ),
    );
  }

  Widget _actionBtn(IconData icon, String label) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        CircleAvatar(backgroundColor: Colors.white, radius: 18, child: Icon(icon, color: Colors.black54, size: 20)),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(color: Colors.black54, fontSize: 10)),
      ],
    );
  }

  Widget _captureBtn() {
    return Container(
      width: 65, height: 65,
      decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
      padding: const EdgeInsets.all(4),
      child: Container(
        decoration: const BoxDecoration(color: Color(0xFF2D2E8B), shape: BoxShape.circle),
        child: const Icon(Icons.qr_code_scanner, color: Colors.white, size: 28),
      ),
    );
  }
}