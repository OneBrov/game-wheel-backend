import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { RegistrationUserDto, UserDto } from './dto/user.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('/users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('/registration')
  async registration(@Body() dto: RegistrationUserDto) {
    console.log(dto);
    const token = await this.usersService.registration(dto);
    return {
      access_token: token,
    };
  }

  @Post('/login')
  async login(@Body() dto: UserDto) {
    const token = await this.usersService.login(dto);
    return {
      access_token: token,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('/refreshToken')
  async refreshToken(@Req() req: any) {
    if (!req.user)
      throw new InternalServerErrorException('User not found in request.');

    const token = await this.usersService.generateTokenFromUser(req.user);

    return {
      access_token: token,
    };
  }
}
