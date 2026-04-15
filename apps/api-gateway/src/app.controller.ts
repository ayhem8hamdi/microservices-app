import {
	Body,
	Controller,
	Get,
	HttpException,
	HttpStatus,
	Inject,
	Param,
	Post,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, throwError } from 'rxjs';
import {
	CreateOrderDto,
	CreateUserDto,
	GetUserDto,
	PATTERNS,
} from '../../../libs/shared/src';


@Controller()
export class AppController {
constructor(
@Inject('USERS_SERVICE') private readonly usersClient: ClientProxy,
@Inject('ORDERS_SERVICE') private readonly ordersClient: ClientProxy,
) {}

private toHttpException(err: unknown): HttpException {
	const defaultMessage = 'Internal server error';
	const defaultStatus = HttpStatus.INTERNAL_SERVER_ERROR;

	if (typeof err === 'string') {
		const inferredStatus = /not found/i.test(err)
			? HttpStatus.NOT_FOUND
			: defaultStatus;
		return new HttpException(err, inferredStatus);
	}

	if (err && typeof err === 'object') {
		const message =
			'message' in err
				? String((err as { message?: unknown }).message ?? defaultMessage)
				: defaultMessage;

		const inferredStatusFromMessage = /not found/i.test(message)
			? HttpStatus.NOT_FOUND
			: defaultStatus;

		const statusCode =
			'statusCode' in err && typeof (err as { statusCode?: unknown }).statusCode === 'number'
				? (err as { statusCode: number }).statusCode
				: 'status' in err && typeof (err as { status?: unknown }).status === 'number'
					? (err as { status: number }).status
					: inferredStatusFromMessage;

		return new HttpException(message, statusCode);
	}

	return new HttpException(defaultMessage, defaultStatus);
}

@Get('users/:id')
async getUser(@Param('id') id: string) {
// .send() = request/response (awaits a reply)
// firstValueFrom() converts the Observable to a Promise
const payload: GetUserDto = { id: Number(id) };

return firstValueFrom(
	this.usersClient.send(PATTERNS.USERS.GET_ONE, payload).pipe(
		catchError((err) => throwError(() => this.toHttpException(err))),
	),
);
}
@Post('users')
async createUser(@Body() body: CreateUserDto) {
return firstValueFrom(
this.usersClient.send(PATTERNS.USERS.CREATE, body)
);
}

@Post('orders')
async createOrder(@Body() body: CreateOrderDto) {
return firstValueFrom(
this.ordersClient.send(PATTERNS.ORDERS.PLACE, body).pipe(
	catchError((err) => throwError(() => this.toHttpException(err))),
),
);
}
}
