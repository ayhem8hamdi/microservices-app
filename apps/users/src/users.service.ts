import { Injectable } from '@nestjs/common';
// In-memory store for now — Prisma comes in Tutorial 3
const users: any[] = [];
let idCounter = 1;
@Injectable()
export class UsersService {
findOne(id: number) {
const user = users.find(u => u.id === id);
if (!user) return { error: 'User not found' };
return user;
}
create(data: { name: string; email: string }) {
const user = { id: idCounter++, ...data };
users.push(user);
return user;
}
findAll() {
return users;
}
}
