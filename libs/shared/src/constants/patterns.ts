export const PATTERNS = {
  USERS: {
    GET_ONE: 'get_user',
    CREATE: 'create_user',
    GET_ALL: 'get_all_users',
  },
  ORDERS: {
    PLACE: 'place_order',
    GET_ONE: 'get_order',
  },
  EVENTS: { 
    ORDER_PLACED:    'order.placed', 
    ORDER_CANCELLED: 'order.cancelled', 
    ORDER_SHIPPED:   'order.shipped', 
    USER_CREATED:    'user.created', 
    PAYMENT_FAILED:  'payment.failed', 
    ANALYTICS_ORDER_TRACKED: 'analytics.order.tracked',

  }, 
} as const;

export const QUEUES = {
  NOTIFICATIONS: 'notifications_queue',
} as const;

export const EXCHANGES = { 
     ORDERS: { 
    name: 'orders.exchange', 
    type: 'topic',  
  }, 
} as const; 