import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { CreateUserDto, GetUserDto, PATTERNS } from '../../../libs/shared/src';
@Controller()
export class UsersController {
constructor(private readonly usersService: UsersService) {}
// This handles any message sent with the shared pattern PATTERNS.USERS.GET_ONE
@MessagePattern(PATTERNS.USERS.GET_ONE)
getUser(@Payload() data: GetUserDto) {
return this.usersService.findOne(data.id);
}
@MessagePattern(PATTERNS.USERS.CREATE)
createUser(@Payload() data: CreateUserDto) {
return this.usersService.create(data);
}
}
