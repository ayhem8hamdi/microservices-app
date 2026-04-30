export class OrderAnalyticsEvent {
  orderId!: number;
  userId!: number;
  total!: number;
  status!: string;
  userEmail?: string;
  userName?: string;
}