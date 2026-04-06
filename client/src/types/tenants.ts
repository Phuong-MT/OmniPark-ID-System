export interface Tenant {
    _id: string
    name: string,
    status: string,
    description?: string;
    address?: string,
    contactEmail?: string,
    contactPhone?: string,
    maxDevices?: number,
    maxUsers?: number,
};