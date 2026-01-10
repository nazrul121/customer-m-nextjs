export type ServiceType = {
  id: string;
  title: string;
  description?: string;
  _count?: {
    services: number;
  };
  createdAt: Date;
  updatedAt: Date;
}