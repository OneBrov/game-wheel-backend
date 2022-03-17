import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistrationUserDto, UserDto } from './dto/user.dto';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async registration(dto: RegistrationUserDto) {
    const candidate = await this.usersRepository.findOne({
      nickname: dto.nickname,
    });
    if (candidate) {
      throw new ConflictException('User already exists');
    }
    const hashPassword = await bcrypt.hash(dto.password, 3);
    try {
      const user = await this.usersRepository.insert({
        nickname: dto.nickname,
        password: hashPassword,
      });

      const userPayload = {
        id: user.generatedMaps[0].id,
        username: dto.nickname,
        password: hashPassword,
      };
      const token = this.jwtService.sign(userPayload);
      return token;
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  async login(dto: UserDto) {
    const user = await this.usersRepository.findOne({ nickname: dto.nickname });
    if (!user) {
      throw new BadRequestException(
        'Пользователь с введенным логином не найден.',
      );
    }
    const isValidPassword = await bcrypt.compare(
      dto.password,
      String(user.password),
    );
    if (!isValidPassword) {
      throw new BadRequestException('Неверный пароль.');
    }

    const userPayload = {
      id: user.id,
      nickname: dto.nickname,
      password: user.password,
    };
    const token = this.jwtService.sign(userPayload);
    return token;
  }

  async generateTokenFromUser(tokenUser: UserDto) {
    const userPayload = {
      id: tokenUser.id,
      nickname: tokenUser.nickname,
      password: tokenUser.password,
    };
    return this.jwtService.sign(userPayload);
  }
}
