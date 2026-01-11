// @/types/service.ts
export type Service = {
  id: string;
  name: string;
  initCost?: number; // Use lowercase 'number' for TS primitive
  mmc?: number;
  serviceTypeId: string;
  serviceType?: {
    id: string;
    title: string; // 👈 This is what you defined
  };
  createdAt: Date;
  updatedAt: Date;
}