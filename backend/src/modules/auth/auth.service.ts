import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.isActive) throw new UnauthorizedException('Credenciales inválidas');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    await this.usersService.touchLastLogin(user.id);
    const payload = { sub: user.id, email: user.email, roleId: user.roleId };
    return {
      success: true,
      message: 'Autenticación correcta',
      data: {
        accessToken: await this.jwtService.signAsync(payload),
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          roleId: user.roleId,
          roleCode: user.role.code,
          technicianId: user.technicianId,
        },
      },
    };
  }

  async me(userId: number) {
    return this.usersService.findPublicById(userId);
  }
}
