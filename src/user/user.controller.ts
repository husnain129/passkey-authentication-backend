import { Body, Controller, Post } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/register')
  create(@Body() createUserDto: Prisma.UserCreateInput) {
    return this.userService.register(createUserDto);
  }

  @Post('/register-verify')
  registerVerify(@Body() loginUserDto: { userId: string; credential: any }) {
    return this.userService.registerVerify(
      loginUserDto.userId,
      loginUserDto.credential,
    );
  }

  @Post('/login-challenge')
  loginChallenge(@Body() body: { email: string }) {
    return this.userService.loginChallenge(body.email);
  }

  @Post('/login-verify')
  loginVerify(@Body() loginUserDto: { email: string; credential: any }) {
    return this.userService.loginVerify(
      loginUserDto.email,
      loginUserDto.credential,
    );
  }
}
