export const demoPharmacies = [
  { id: 'ph-1', name: 'BlueCare Pharmacy', address: 'Nasr City, Cairo', phone: '+20 100 111 2222', email: 'bluecare@adwety.app', working_hours: 'Daily 9 AM - 11 PM', status: 'active', rating: 4.8, latitude: 30.061, longitude: 31.343, google_maps_url: 'https://www.google.com/maps?q=30.061,31.343', inventory_count: 5 },
  { id: 'ph-2', name: 'Teal Health Pharmacy', address: 'Dokki, Giza', phone: '+20 100 333 4444', email: 'teal@adwety.app', working_hours: 'Daily 8 AM - 12 AM', status: 'active', rating: 4.5, latitude: 30.037, longitude: 31.211, google_maps_url: 'https://www.google.com/maps?q=30.037,31.211', inventory_count: 4 },
  { id: 'ph-3', name: 'Cure Plus Pharmacy', address: 'Maadi, Cairo', phone: '+20 100 555 6666', email: 'cureplus@adwety.app', working_hours: '24/7', status: 'inactive', rating: 4.1, latitude: 29.960, longitude: 31.257, google_maps_url: 'https://www.google.com/maps?q=29.960,31.257', inventory_count: 3 },
];

export const demoMedicines = [
  { id: 'med-1', inventory_id: 'inv-1', name: 'Panadol Extra', category: 'Pain Relief', strength: '500mg', form: 'Tablet', price: 46.5, quantity: 22, pharmacy_id: 'ph-1', pharmacy_name: 'BlueCare Pharmacy', description: 'Paracetamol and caffeine tablets for pain relief.', updated_at: '2026-04-28T11:00:00.000Z' },
  { id: 'med-2', inventory_id: 'inv-2', name: 'Amoxicillin', category: 'Antibiotics', strength: '500mg', form: 'Capsule', price: 89, quantity: 6, pharmacy_id: 'ph-1', pharmacy_name: 'BlueCare Pharmacy', description: 'Broad-spectrum antibiotic capsule.', updated_at: '2026-04-27T09:30:00.000Z' },
  { id: 'med-3', inventory_id: 'inv-3', name: 'Glucophage', category: 'Diabetes', strength: '1000mg', form: 'Tablet', price: 72, quantity: 0, pharmacy_id: 'ph-2', pharmacy_name: 'Teal Health Pharmacy', description: 'Metformin tablets for diabetes management.', updated_at: '2026-04-26T15:20:00.000Z' },
  { id: 'med-4', inventory_id: 'inv-4', name: 'Ventolin', category: 'Respiratory', strength: '100mcg', form: 'Inhaler', price: 118, quantity: 14, pharmacy_id: 'ph-2', pharmacy_name: 'Teal Health Pharmacy', description: 'Salbutamol inhaler for asthma and bronchospasm.', updated_at: '2026-04-25T18:45:00.000Z' },
  { id: 'med-5', inventory_id: 'inv-5', name: 'Concor', category: 'Blood Pressure', strength: '5mg', form: 'Tablet', price: 64, quantity: 8, pharmacy_id: 'ph-3', pharmacy_name: 'Cure Plus Pharmacy', description: 'Bisoprolol tablet for blood pressure control.', updated_at: '2026-04-24T12:10:00.000Z' },
  { id: 'med-6', inventory_id: 'inv-6', name: 'Cataflam', category: 'Pain Relief', strength: '50mg', form: 'Tablet', price: 38, quantity: 17, pharmacy_id: 'ph-1', pharmacy_name: 'BlueCare Pharmacy', description: 'Diclofenac potassium tablets.', updated_at: '2026-04-23T08:25:00.000Z' },
  { id: 'med-7', inventory_id: 'inv-7', name: 'Augmentin', category: 'Antibiotics', strength: '1g', form: 'Tablet', price: 145, quantity: 3, pharmacy_id: 'ph-2', pharmacy_name: 'Teal Health Pharmacy', description: 'Amoxicillin and clavulanic acid tablets.', updated_at: '2026-04-22T17:05:00.000Z' },
];

export const demoNotifications = [
  { id: 'n-1', type: 'stock', title: 'Low stock alert', message: 'Amoxicillin is low in BlueCare Pharmacy. Qty: 6', is_read: false, created_at: '2026-04-29T10:00:00.000Z' },
  { id: 'n-2', type: 'prescription', title: 'Prescription processed', message: '3 medicines extracted successfully with high confidence.', is_read: false, created_at: '2026-04-29T09:15:00.000Z' },
  { id: 'n-3', type: 'system', title: 'System update', message: 'Dashboard analytics cache refreshed.', is_read: true, created_at: '2026-04-28T20:00:00.000Z' },
  { id: 'n-4', type: 'stock', title: 'Out of stock', message: 'Glucophage is out of stock in Teal Health Pharmacy.', is_read: false, created_at: '2026-04-28T12:30:00.000Z' },
];

export const demoScanTrend = [
  { label: 'Sat', scans: 5, low: 8 }, { label: 'Sun', scans: 8, low: 7 }, { label: 'Mon', scans: 7, low: 10 }, { label: 'Tue', scans: 11, low: 9 }, { label: 'Wed', scans: 13, low: 12 }, { label: 'Thu', scans: 9, low: 11 }, { label: 'Fri', scans: 15, low: 8 },
];

export const demoRequests = [
  { id: 'req-1', pharmacy_name: 'Nova Pharmacy', owner_name: 'Mona Ali', phone: '+20 101 888 2222', email: 'nova@example.com', address: 'Heliopolis, Cairo', status: 'pending', created_at: '2026-04-29T08:00:00.000Z' },
  { id: 'req-2', pharmacy_name: 'Green Cross', owner_name: 'Ahmed Samir', phone: '+20 102 999 3333', email: 'green@example.com', address: 'Alexandria', status: 'approved', created_at: '2026-04-25T14:00:00.000Z' },
  { id: 'req-3', pharmacy_name: 'Medi Home', owner_name: 'Sara Nabil', phone: '+20 106 444 1010', email: 'medi@example.com', address: 'New Cairo', status: 'rejected', created_at: '2026-04-20T14:00:00.000Z', rejection_reason: 'Incomplete documents' },
];

export const demoTickets = [
  { id: 't-1', title: 'Cannot update medicine price', user: 'BlueCare Manager', pharmacy: 'BlueCare Pharmacy', priority: 'high', status: 'open', created_at: '2026-04-29T11:00:00.000Z', assigned_admin: 'Unassigned', message: 'The pharmacy admin cannot update Panadol Extra price from the inventory table.' },
  { id: 't-2', title: 'Scanner confidence is low', user: 'Teal Manager', pharmacy: 'Teal Health Pharmacy', priority: 'medium', status: 'in_progress', created_at: '2026-04-28T16:00:00.000Z', assigned_admin: 'Support Admin', message: 'Several handwritten prescriptions return low confidence.' },
  { id: 't-3', title: 'Need pharmacy activation', user: 'Nova Owner', pharmacy: 'Nova Pharmacy', priority: 'urgent', status: 'resolved', created_at: '2026-04-27T13:00:00.000Z', assigned_admin: 'Super Admin', message: 'Activation was completed after document review.' },
];

export const demoUsers = [
  { id: 'u-1', name: 'Super Admin', email: 'admin@adwety.app', role: 'super_admin', status: 'active', assigned_pharmacy: 'All pharmacies', last_login: '2026-04-29T08:30:00.000Z' },
  { id: 'u-2', name: 'BlueCare Manager', email: 'pharmacy@adwety.app', role: 'pharmacy_admin', status: 'active', assigned_pharmacy: 'BlueCare Pharmacy', last_login: '2026-04-28T15:20:00.000Z' },
  { id: 'u-3', name: 'Support Admin', email: 'support@adwety.app', role: 'support_admin', status: 'active', assigned_pharmacy: 'Support Team', last_login: '2026-04-27T11:45:00.000Z' },
  { id: 'u-4', name: 'Regular User', email: 'user@adwety.app', role: 'user', status: 'inactive', assigned_pharmacy: 'None', last_login: '2026-04-18T11:45:00.000Z' },
];

export function getDemoPharmacyDetails(pharmacyId) {
  const pharmacy = demoPharmacies.find((item) => item.id === pharmacyId) || demoPharmacies[0];
  const inventory = demoMedicines.filter((medicine) => medicine.pharmacy_id === pharmacy.id).map((medicine) => ({
    drug: medicine,
    inventory: { id: medicine.inventory_id, price: medicine.price, quantity: medicine.quantity },
  }));
  const low = inventory.filter((item) => item.inventory.quantity > 0 && item.inventory.quantity < 10).length;
  const out = inventory.filter((item) => item.inventory.quantity <= 0).length;
  return { pharmacy, inventory, stats: { total_inventory_items: inventory.length, low_stock_count: low, out_of_stock_count: out } };
}
