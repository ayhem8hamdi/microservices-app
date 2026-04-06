import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';
@Controller()
export class UsersController {
constructor(private readonly usersService: UsersService) {}
// This handles any message sent with the pattern 'get_user'
@MessagePattern('get_user')
getUser(@Payload() data: { id: number }) {
return this.usersService.findOne(data.id);
}
@MessagePattern('create_user')
createUser(@Payload() data: { name: string; email: string }) {
return this.usersService.create(data);
}
}
