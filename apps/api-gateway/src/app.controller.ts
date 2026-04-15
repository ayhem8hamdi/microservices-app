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


@Controller('users')
export class AppController {
constructor(
@Inject('USERS_SERVICE') private readonly usersClient: ClientProxy,
) {}

private toHttpException(err: unknown): HttpException {
	const defaultMessage = 'Internal server error';
	const defaultStatus = HttpStatus.INTERNAL_SERVER_ERROR;

	if (typeof err === 'string') {
		return new HttpException(err, defaultStatus);
	}

	if (err && typeof err === 'object') {
		const statusCode =
			'statusCode' in err && typeof (err as { statusCode?: unknown }).statusCode === 'number'
				? (err as { statusCode: number }).statusCode
				: 'status' in err && typeof (err as { status?: unknown }).status === 'number'
					? (err as { status: number }).status
					: defaultStatus;

		const message =
			'message' in err
				? String((err as { message?: unknown }).message ?? defaultMessage)
				: defaultMessage;

		return new HttpException(message, statusCode);
	}

	return new HttpException(defaultMessage, defaultStatus);
}

@Get(':id')
async getUser(@Param('id') id: string) {
// .send() = request/response (awaits a reply)
// firstValueFrom() converts the Observable to a Promise
return firstValueFrom(
	this.usersClient.send('get_user', { id: Number(id) }).pipe(
		catchError((err) => throwError(() => this.toHttpException(err))),
	),
);
}
@Post()
async createUser(@Body() body: { name: string; email: string }) {
return firstValueFrom(
this.usersClient.send('create_user', body)
);
}
}
