import { Controller, Get, Post, Body, Param, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
@Controller('users')
export class AppController {
constructor(
@Inject('USERS_SERVICE') private readonly usersClient: ClientProxy,
) {}
@Get(':id')
async getUser(@Param('id') id: string) {
// .send() = request/response (awaits a reply)
// firstValueFrom() converts the Observable to a Promise
return firstValueFrom(
this.usersClient.send('get_user', { id: Number(id) })
);
}
@Post()
async createUser(@Body() body: { name: string; email: string }) {
return firstValueFrom(
this.usersClient.send('create_user', body)
);
}
}
