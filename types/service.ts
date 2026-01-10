export type Service = {
  id: string;
  name: string;
  initCost?: Number;
  mmc?: Number;
  serviceTypeId:String,
  serviceType?: {
    id: string;
    title: string;
  };
  createdAt: Date;
  updatedAt: Date;
}