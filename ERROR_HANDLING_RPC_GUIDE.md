# Error Handling Guide (Microservices + API Gateway)

This document explains, in detail, how errors are handled in this project and why a **missing user** now returns **404 Not Found** instead of **500 Internal Server Error**.

---

## 1) The architecture in this project

You have two relevant layers:

1. **Users microservice** (`apps/users`) — receives TCP RPC messages and returns data/errors.
2. **API Gateway** (`apps/api-gateway`) — receives HTTP requests from clients and calls microservices through `ClientProxy`.

So your flow for `GET /users/:id` is:

HTTP client -> API Gateway -> RPC over TCP -> Users service -> response/error -> API Gateway -> HTTP response

---

## 2) Where the error is created

File: `apps/users/src/users.service.ts`

In `findOne(id: number)`, if no user exists, the service throws:

- `new RpcException('User not found')`

This is a **microservice-level** error (RPC context), not an HTTP error yet.

---

## 3) Why you used to get 500

Before explicit mapping in the gateway, the RPC error reached the API gateway call as a failed stream/promise.

If the gateway does **not** translate that failure into a known HTTP exception, Nest treats it as an unhandled server error and returns:

- `500 Internal server error`

In short:

- RPC error happened ✅
- HTTP translation missing ❌
- fallback status became 500

---

## 4) How it now becomes 404

File: `apps/api-gateway/src/app.controller.ts`

In `getUser()`:

1. Gateway calls `usersClient.send('get_user', { id: Number(id) })`
2. `catchError(...)` intercepts RPC failures
3. Gateway extracts/normalizes an error message
4. Gateway throws `new NotFoundException(message)`

`NotFoundException` is an **HTTP exception** with status code **404**.

That means Nest HTTP layer now responds with 404 intentionally.

---

## 5) What is `RpcExceptionFilter`?

File: `apps/api-gateway/src/common/filters/rpc-exception.filter.ts`

`RpcExceptionFilter` is a Nest **Exception Filter** decorated with:

- `@Catch(RpcException)`

Its job is to catch `RpcException` instances in HTTP request handling and convert them into a structured HTTP JSON response.

In this project, it does:

- reads `exception.getError()`
- tries to get `statusCode` (defaults to `404` if absent)
- tries to get `message`
- returns JSON:
  - `{ statusCode, message }`

It is registered globally in:

- `apps/api-gateway/src/main.ts`

with:

- `app.useGlobalFilters(new RpcExceptionFilter())`

---

## 6) Important nuance: filter vs controller mapping

For your current `GET /users/:id` path, you now throw `NotFoundException` inside `AppController`.

That means:

- the 404 is primarily produced by the **controller mapping logic** (`catchError` -> `NotFoundException`)
- `RpcExceptionFilter` is still useful, but this specific path no longer depends on it to achieve 404

So you currently have two valid protection layers:

1. **Primary**: controller-level mapping to HTTP exception
2. **Secondary**: global RPC exception filter for `RpcException` cases

This is a good defensive setup.

---

## 7) Error lifecycle for missing user (step-by-step)

1. Client calls: `GET /users/999`
2. Gateway sends RPC message: `get_user` with `{ id: 999 }`
3. Users service cannot find user -> throws `RpcException('User not found')`
4. Gateway receives RPC failure in RxJS stream
5. `catchError` maps failure -> `NotFoundException('User not found')`
6. Nest HTTP exception layer sends response:
   - status: `404`
   - body contains not-found message

---

## 8) When to use which exception type

### In microservices (TCP/RMQ/etc.)

Use:

- `RpcException`

because the transport is RPC, not HTTP.

### In API Gateway controllers (HTTP)

Use:

- `NotFoundException`, `BadRequestException`, etc.

because the client expects HTTP semantics and status codes.

---

## 9) Quick troubleshooting checklist

If you unexpectedly see 500 again:

1. Confirm users service still throws `RpcException` for missing entities.
2. Confirm gateway `getUser()` still has `catchError` mapping to `NotFoundException`.
3. Rebuild containers (`docker compose up --build -d`) since images are build-based.
4. Check gateway logs and users logs for the failing request.
5. Confirm the request hits `/users/:id` and not another route.

---

## 10) Practical takeaway

A status code is not just about where an error happens, but where it is **translated**.

- Error originates in microservice (RPC)
- Meaningful status is finalized in gateway (HTTP)

That translation step is what changed your result from **500** to **404**.
