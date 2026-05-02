import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../models/pharmacy_details.dart';
import '../../../../services/service_providers.dart';

final FutureProviderFamily<PharmacyDetailsModel, String>
    pharmacyDetailsProvider =
    FutureProvider.family<PharmacyDetailsModel, String>(
  (Ref ref, String pharmacyId) {
    return ref.read(apiServiceProvider).getPharmacyDetails(pharmacyId);
  },
);
