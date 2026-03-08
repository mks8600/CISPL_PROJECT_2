export const vendors = [
  {
    id: 'vendor-1',
    name: 'FilmWorks Ltd',
    email: 'contact@filmworks.com',
    specialization: 'Polyester Films',
    contactPerson: 'Mike Wilson',
    phone: '+1 (555) 123-4567',
  },
  {
    id: 'vendor-2',
    name: 'Industrial Films Co',
    email: 'info@industrialfilms.com',
    specialization: 'PVC Films',
    contactPerson: 'Sarah Johnson',
    phone: '+1 (555) 234-5678',
  },
  {
    id: 'vendor-3',
    name: 'Quality Films Inc',
    email: 'sales@qualityfilms.com',
    specialization: 'Multi-layer Films',
    contactPerson: 'David Chen',
    phone: '+1 (555) 345-6789',
  },
];

export function getVendorById(id) {
  return vendors.find((v) => v.id === id);
}

export function getVendorName(id) {
  const vendor = getVendorById(id);
  return vendor?.name || 'Unknown Vendor';
}
