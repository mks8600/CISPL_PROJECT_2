export const mockCompanies = [
  { id: 'comp-1', orgCode: 'CRYSTAL', name: 'Crystal Industries' },
  { id: 'comp-2', orgCode: 'ACME', name: 'Acme Corp' },
];

export const companyUsers = [
  {
    id: 'company-1',
    email: 'admin',
    name: 'Admin User',
    role: 'admin',
    portalType: 'company',
    password: 'admin',
    companyId: 'comp-1',
  },
  {
    id: 'company-2',
    email: 'manager@crystalindustries.com',
    name: 'John Manager',
    role: 'manager',
    portalType: 'company',
    password: 'demo123',
    companyId: 'comp-1',
  },
  {
    id: 'company-3',
    email: 'acmeadmin',
    name: 'Acme Administrator',
    role: 'admin',
    portalType: 'company',
    password: 'admin',
    companyId: 'comp-2',
  },
];

export const vendorUsers = [
  {
    id: 'vendor-user-1',
    email: 'vendor@filmworks.com',
    name: 'Mike Wilson',
    companyName: 'FilmWorks Ltd',
    portalType: 'vendor',
    vendorId: 'vendor-1',
    password: 'vendor123',
  },
  {
    id: 'vendor-user-2',
    email: 'vendor@industrialfilms.com',
    name: 'Sarah Johnson',
    companyName: 'Industrial Films Co',
    portalType: 'vendor',
    vendorId: 'vendor-2',
    password: 'vendor123',
  },
  {
    id: 'vendor-user-3',
    email: 'vendor@qualityfilms.com',
    name: 'David Chen',
    companyName: 'Quality Films Inc',
    portalType: 'vendor',
    vendorId: 'vendor-3',
    password: 'vendor123',
  },
];

export const superAdminUser = {
  id: 'super-admin-1',
  email: 'superadmin',
  name: 'Master Administrator',
  role: 'superadmin',
  portalType: 'superadmin',
  password: 'admin',
};
