// This file contains JSDoc type definitions for the project

/**
 * @typedef {'admin' | 'manager'} UserRole
 * @typedef {'company' | 'vendor'} PortalType
 */

/**
 * @typedef {Object} CompanyUser
 * @property {string} id
 * @property {string} email
 * @property {string} name
 * @property {UserRole} role
 * @property {'company'} portalType
 */

/**
 * @typedef {Object} VendorUser
 * @property {string} id
 * @property {string} email
 * @property {string} name
 * @property {string} companyName
 * @property {'vendor'} portalType
 * @property {string} vendorId
 */

/**
 * @typedef {CompanyUser | VendorUser} User
 */

/**
 * @typedef {Object} Vendor
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} specialization
 * @property {string} contactPerson
 * @property {string} phone
 */

/**
 * @typedef {'low' | 'medium' | 'high' | 'urgent'} OrderPriority
 * @typedef {'pending' | 'in-progress' | 'completed'} OrderStatus
 */

/**
 * @typedef {Object} Deliverable
 * @property {string} id
 * @property {string} orderId
 * @property {string} fileName
 * @property {number} fileSize
 * @property {string} fileType
 * @property {string} uploadedAt
 * @property {string} uploadedBy
 */

/**
 * @typedef {Object} StatusHistoryEntry
 * @property {OrderStatus} status
 * @property {string} changedAt
 * @property {string} changedBy
 * @property {string} [notes]
 */

/**
 * @typedef {Object} WorkOrder
 * @property {string} id
 * @property {string} title
 * @property {string} filmType
 * @property {number} quantity
 * @property {string} unit
 * @property {string} specifications
 * @property {OrderPriority} priority
 * @property {OrderStatus} status
 * @property {string} assignedVendorId
 * @property {string} dueDate
 * @property {string} createdAt
 * @property {string} createdBy
 * @property {string} notes
 * @property {Deliverable[]} deliverables
 * @property {StatusHistoryEntry[]} statusHistory
 */

/**
 * @typedef {Object} CreateOrderFormData
 * @property {string} title
 * @property {string} filmType
 * @property {number} quantity
 * @property {string} unit
 * @property {string} specifications
 * @property {OrderPriority} priority
 * @property {string} assignedVendorId
 * @property {string} dueDate
 * @property {string} notes
 */

/**
 * @typedef {Object} AuthState
 * @property {User | null} user
 * @property {boolean} isAuthenticated
 */

/**
 * @typedef {Object} AuthContextType
 * @property {User | null} user
 * @property {boolean} isAuthenticated
 * @property {(email: string, password: string, portal: PortalType) => Promise<boolean>} login
 * @property {() => void} logout
 */

export {};
