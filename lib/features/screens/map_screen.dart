import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';

import '../../core/constants/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key, this.medicineName, this.fromScan = false});

  final String? medicineName;
  final bool fromScan;

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  static const String _osmTileUrl =
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

  // Must be a real package-style identifier to comply with OSM policy.
  static const String _userAgentPackageName = 'com.example.adwety_ui';

  static const LatLng _initialCenter = LatLng(30.0444, 31.2357);
  static const double _initialZoom = 13;

  static const LatLng _samplePharmacyLocation = LatLng(30.0461, 31.2365);

  final MapController _mapController = MapController();

  late final List<Marker> _markers = <Marker>[
    const Marker(
      point: _samplePharmacyLocation,
      width: 46,
      height: 46,
      child: _PharmacyMarker(),
    ),
  ];

  void _recenter() {
    _mapController.move(_initialCenter, _initialZoom);
  }

  @override
  Widget build(BuildContext context) {
    final String title =
        widget.fromScan && (widget.medicineName?.isNotEmpty ?? false)
        ? 'Available pharmacies for ${widget.medicineName}'
        : 'Nearby Pharmacies';

    return Scaffold(
      body: SafeArea(
        child: Stack(
          children: <Widget>[
            Positioned.fill(
              child: FlutterMap(
                mapController: _mapController,
                options: const MapOptions(
                  initialCenter: _initialCenter,
                  initialZoom: _initialZoom,
                  minZoom: 3,
                  maxZoom: 19,
                ),
                children: <Widget>[
                  TileLayer(
                    urlTemplate: _osmTileUrl,
                    userAgentPackageName: _userAgentPackageName,
                    maxZoom: 19,
                    maxNativeZoom: 19,
                    panBuffer: 2,
                  ),
                  MarkerLayer(markers: _markers),
                  const RichAttributionWidget(
                    alignment: AttributionAlignment.bottomRight,
                    attributions: <SourceAttribution>[
                      TextSourceAttribution('OpenStreetMap contributors'),
                    ],
                  ),
                ],
              ),
            ),
            Positioned(
              top: 16,
              left: 16,
              right: 16,
              child: _TopInfoCard(
                title: title,
                onBack: () => context.go(AppRoutes.home),
              ),
            ),
            Positioned(
              right: 16,
              bottom: 16,
              child: FloatingActionButton.small(
                heroTag: 'map-recenter',
                backgroundColor: Colors.white,
                onPressed: _recenter,
                child: const Icon(
                  Icons.my_location_rounded,
                  color: AppColors.primary,
                ),
              ),
            ),
            const Positioned(
              left: 16,
              bottom: 16,
              child: _VisibleAttributionLabel(),
            ),
          ],
        ),
      ),
    );
  }
}

class _TopInfoCard extends StatelessWidget {
  const _TopInfoCard({required this.title, required this.onBack});

  final String title;
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: <BoxShadow>[
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: <Widget>[
          Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: onBack,
              child: const Padding(
                padding: EdgeInsets.all(8),
                child: Icon(Icons.arrow_back_ios_new_rounded, size: 18),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              title,
              style: AppTextStyles.label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

class _PharmacyMarker extends StatelessWidget {
  const _PharmacyMarker();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.primary,
        borderRadius: BorderRadius.circular(999),
        boxShadow: <BoxShadow>[
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.18),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: const Icon(
        Icons.local_pharmacy_rounded,
        color: Colors.white,
        size: 22,
      ),
    );
  }
}

class _VisibleAttributionLabel extends StatelessWidget {
  const _VisibleAttributionLabel();

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.55),
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Padding(
          padding: EdgeInsets.symmetric(horizontal: 8, vertical: 5),
          child: Text(
            '© OpenStreetMap contributors',
            style: TextStyle(
              color: Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ),
    );
  }
}
