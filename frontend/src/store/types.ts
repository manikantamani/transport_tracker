export interface Trip {
  id: string;
  title: string;
  bookingDate: string; // ISO date string YYYY-MM-DD (trip date)
  bookedOnDate: string; // ISO date string
  fromLocation: string;
  fromContact: string;
  toLocation: string;
  toContact: string;
  totalCost: number;
  driverId?: string;
  driverName?: string;
  vehicleId?: string;
  vehicleNumber?: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  vehicleType: string; // e.g. Truck, Van, Car
  model: string;
  registrationNumber: string;
  photo?: string; // base64 data uri
  registrationDoc?: string; // base64 data uri
  createdAt: string;
}

export interface Driver {
  id: string;
  name: string;
  contactNumber: string;
  licenseDoc?: string; // base64
  profilePic?: string; // base64
  createdAt: string;
}

export interface Profile {
  name: string;
  mobile: string;
  email: string;
  company?: string;
}
