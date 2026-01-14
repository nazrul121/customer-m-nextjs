import { z } from 'zod'

const OptionalFileSchema = z
  .instanceof(File)
  .refine((file) => file.size > 0, "Photo is required") // Validation if a file is present
  .optional()
  .or(z.literal("")); 

  

// --- User Schema  ---
const UserRoles = ["user", "admin", "guest"] as const;
export const userSchema = z.object({
  name: z.string()
    .min(2, { message: 'Name must be 2 or more characters long' })
    .max(80, { message: 'Name cannot exceed 80 characters' }),
  email: z.string()
    .email({ message: 'Must be a valid email address' })
    .max(100, { message: 'Email cannot exceed 100 characters' }),

  phoneNumber: z.string()
    .max(11, { message: 'Phone No must be 11 characters' })
    .min(11, {message: 'Phone No must be 11 characters'}),

  password: z.string()
    .min(8, { message: 'Password min: 8 characters long' })
    .optional() 
    .or(z.literal('')),
  role: z.enum(UserRoles),
  status: z.string(),
})
export type UserForm = z.infer<typeof userSchema>


export const ServiceTypeSchema = z.object({
  title: z.string()
    .min(2, { message: 'Title must be 2 or more characters long' })
    .max(80, { message: 'Title cannot exceed 80 characters' }),
  description: z.string()
    .max(100, { message: 'Description cannot exceed 100 characters' }),

})
export type ServiceTypeForm = z.infer<typeof ServiceTypeSchema>


export const ServiceSchema = z.object({
  name: z.string()
    .min(2, { message: 'Title must be 2 or more characters long' })
    .max(80, { message: 'Title cannot exceed 80 characters' }),
  initCost: z.number().min(0,'Initional cost required'),
  mmc:z.number().min(0,'MMC is required'),
  serviceTypeId:z.string().min(1,'Service Type is required'),

})
export type ServiceForm = z.infer<typeof ServiceSchema>


export const CustomerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  customerCode:z.string().min(5, "customerCode need  min of 5 char"),
  email: z.string().email("Invalid email").optional().or(z.string().length(0)),
  phone: z.string()
    .length(11, "Phone number must be exactly 11 digits")
    .regex(/^01[3-9]\d{8}$/, "Invalid Bangladesh mobile number format (e.g., 017xxxxxxxx)"),
  photo: z.any().optional(),
  aggrePaper: z.any().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});
export type CustomerForm = z.infer<typeof CustomerSchema>



export const CustomerServiceSchema = z.object({
  customerId: z.string().min(1),
  serviceId: z.string().min(1, "Please select a service"),
  initCost: z.coerce.number().min(0),
  mmc: z.coerce.number().min(0),
  initCostDis: z.coerce.number().default(0),
  mmcDis: z.coerce.number().default(0),
  aggreDate:z.coerce.date(),
  startDate: z.coerce.date(),
  expiryDate: z.coerce.date(),
  initPayment: z.coerce.number().default(0),
  isRepeat: z.enum(["YES", "NO"]),
});

// 🔑 This is the critical part
export type CustomerServiceForm = z.input<typeof CustomerServiceSchema>;
export type CustomerServiceOutput = z.output<typeof CustomerServiceSchema>;


export const settingSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string().min(1, "Value is required"),
});


export const MonthlyBillSchema = z.object({
  customerServiceId: z.string(),
  monthFor: z.string(),
  paidAmount: z.coerce.number().min(0),
  mmc: z.coerce.number().min(0),
  paidDate: z.coerce.date(),
});

export type MonthlyBillForm = z.infer<typeof MonthlyBillSchema>;


			
export const SetupBillSchema = z.object({
  customerServiceId: z.string().min(1, "Required"),
  // 🔑 Use coerce to turn string input into a number
  paidAmount: z.coerce.number().min(0, "Amount must be positive"),
  // 🔑 Use coerce to turn string date into a Date object
  paidDate: z.coerce.date(),
  debitAmount:z.coerce.number().min(0, "Amount must be positive"),
  receivedB: z.string().min(1, "Required"),
});
export type SetupBillForm = z.input<typeof SetupBillSchema>;

