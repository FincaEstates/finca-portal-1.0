export type RequestStatus =
  | 'New'
  | 'In Review'
  | 'Assigned'
  | 'In Progress'
  | 'Waiting on Tenant'
  | 'Completed'
  | 'Closed';

export type RequestPriority = 'Emergency' | 'High' | 'Normal' | 'Low';

export type MaintenanceRequest = {
  id: string;
  request_number: number;
  full_name: string;
  email: string;
  phone: string | null;
  property_name: string;
  unit_number: string | null;
  category: string;
  priority: RequestPriority;
  title: string;
  description: string;
  permission_to_enter: boolean;
  best_time_to_contact: string | null;
  status: RequestStatus;
  photo_urls: string[];
  admin_notes: string | null;
  submitted_at: string;
  updated_at: string;
  completed_at: string | null;
};
