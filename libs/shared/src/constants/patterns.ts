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
ORDER_PLACED: 'order_placed',
USER_CREATED: 'user_created',
},
} as const;
