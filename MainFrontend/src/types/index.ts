export interface User {
  id: string;
  empCode: string;
  name: string;
  role: 'Staff' | 'Head' | 'Manager' | 'Warehouse' | 'President Operations' | 'Director';
  department: string;
  email: string;
  designation: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  minStock: number;
  maxStock: number;
}

export interface BatchInfo {
  id: string;
  itemId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unitCost: number;
  supplier: string;
}

export interface InventoryRequest {
  id: string;
  empCode: string;
  requesterName: string;
  department: string;
  itemId: string;
  itemName: string;
  quantity: number;
  reason: string;
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  batchPreference?: string;
  status: 'Pending' | 'Approved' | 'Issued' | 'Claimed' | 'Rejected';
  requestDate: string;
  approvedBy?: string;
  approvedDate?: string;
  issuedBy?: string;
  issuedDate?: string;
  claimedDate?: string;
  comments?: string;
  issuedBatch?: string;
  issuedQuantity?: number;
}

export interface AuthContextType {
  user: User | null;
  login: (empCode: string, password: string) => Promise<boolean>;
  logout: () => void;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  loading: boolean;
}

export interface StockItem {
  itemId: string;
  itemName: string;
  category: string;
  unit: string;
  totalQuantity: number;
  batches: BatchInfo[];
  minStock: number;
  maxStock: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

export interface Alert {
  id: string;
  requestId: string;
  empCode: string;
  requesterName: string;
  itemName: string;
  quantity: number;
  issuedDate: string;
  minutesOverdue: number;
  urgency: string;
}