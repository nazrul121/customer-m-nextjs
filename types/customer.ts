export type Customer = {
  servicesCount: number;
  id: string;
  name: string;
  customerCode: string;
  email?: string;
  phone: Number;
  photo?: string;
  aggrePaper:string;
  status:string;
  createdAt: Date;
  updatedAt: Date;
}
