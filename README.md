# SDA Backend Template

This is a starter backend template using NestJS to save development hours building same features over and over with every new project.

## Documentation

The most documented version is in Postman, published [here](https://documenter.getpostman.com/view/4860768/2s9YsDkEub). Alternatively, you can check auto-generated Swagger docs under `GET /docs` endpoint.

#### Websockets Chat

Since I can't add docs for WS in Postman, I'll write it here. It's configured using socket.io, so in order to use it on the frontend - socket.io-client should be installed there.
At the moment, this API has fully functioning chat between 2 users from the database. Messages are encrypted. This 2 can be easily extended to become a group chat, not only person-to-person.
Please make sure you have read descriptions of chat endpoints from Postman docs to be aware of the context.

Online users are being stored in `connectedUsers` map inside of `ChatGateway` class.
Front-end (socket.io-client) may listen only to 2 listeners:

- error - in case something went wrong, like JWT is expired/incorrect, user not found, etc.
- receivedMessage - if the user who is a receiver online (means their socket id stored inside of `connectedUsers` map) a new message object will be sent to their socket id

And may emit only 1 event:

- message - to send a new message. Example body: `{ message: string; toUserId: string }`.

If the chat (an entity representing the conversation between 2 users) hasn't been found - then it will be created automatically. Immediately after it will become accessible from `/v1/chat/all` and `/v1/chat/:chatId`.

Handling of connect/disconnect works pretty straightforward:

- connect - checking a jwt token -> identifying the user id -> assigning user id with their socket id into the `connectedUsers` map
- disconnect - removing socket id from the `connectedUsers` map

## Features

- ✅ CRUD & Pagination
- ✅ Chat functionality with messages encryption
- ✅ Auth system with access & refresh tokens
- ✅ Roles Guard - user/admin/etc
- ✅ Reset password with integrated Sendgrid as email provider
- ✅ Upload file endpoint with integrated S3 bucket
- ✅ ChatGPT integration
- ✅ Bugsnag, Pino (like morgan ), Helmet & rate-limiting
- ✅ Postman & Swagger docs

## Roadmap

- 🛠️ Jest autotests
- 🛠 Redis
- 🛠 PostgreSQL mirror
- 🛠 Deeper TS coverage: entities, types, dto's
- 🛠 Twilio SMS verification
- 🛠 Notifications

## Note

In some places I left `TODO` comments or other notes, please pay attention to it as it may contain important information.

#### Below is NestJS Original readme

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).
