import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  list(query: ListUsersQueryDto) {
    return this.prisma.user.findMany({
      where: {
        roleId: query.roleId,
        isActive: query.isActive,
        OR: query.search
          ? [
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      orderBy: { id: 'desc' },
      take: query.take ?? 20,
      skip: ((query.page ?? 1) - 1) * (query.take ?? 20),
      select: {
        id: true, firstName: true, lastName: true, email: true, roleId: true,
        technicianId: true, isActive: true, createdAt: true,
      },
    }).then((data) => ({ success: true, data }));
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email }, include: { role: true } });
  }

  async findPublicById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, firstName: true, lastName: true, email: true, roleId: true, technicianId: true, isActive: true, createdAt: true, role: { select: { code: true, name: true } } },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return { success: true, data: { ...user, roleCode: user.role.code, roleName: user.role.name } };
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('El correo ya existe');

    const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
    if (!role) throw new BadRequestException('Rol inválido');

    if (dto.technicianId) {
      const technician = await this.prisma.technician.findUnique({ where: { id: dto.technicianId } });
      if (!technician) throw new BadRequestException('Técnico inválido');
      const alreadyLinked = await this.prisma.user.findFirst({ where: { technicianId: dto.technicianId } });
      if (alreadyLinked) throw new BadRequestException('El técnico ya está vinculado a otro usuario');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const created = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        passwordHash,
        roleId: dto.roleId,
        technicianId: dto.technicianId,
        isActive: true,
      },
      select: { id: true, firstName: true, lastName: true, email: true, roleId: true, technicianId: true, isActive: true },
    });
    return { success: true, message: 'Usuario creado', data: created };
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.ensureExists(id);
    if (dto.email) {
      const existing = await this.prisma.user.findFirst({ where: { email: dto.email, NOT: { id } } });
      if (existing) throw new BadRequestException('El correo ya existe');
    }
    if (dto.roleId) {
      const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
      if (!role) throw new BadRequestException('Rol inválido');
    }
    if (dto.technicianId) {
      const technician = await this.prisma.technician.findUnique({ where: { id: dto.technicianId } });
      if (!technician) throw new BadRequestException('Técnico inválido');
      const linked = await this.prisma.user.findFirst({ where: { technicianId: dto.technicianId, NOT: { id } } });
      if (linked) throw new BadRequestException('El técnico ya está vinculado a otro usuario');
    }
    const data: Record<string, unknown> = { ...dto };
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 10);
    delete data.password;

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, firstName: true, lastName: true, email: true, roleId: true, technicianId: true, isActive: true },
    });
    return { success: true, message: 'Usuario actualizado', data: updated };
  }

  async changeStatus(id: number, isActive: boolean) {
    await this.ensureExists(id);
    const updated = await this.prisma.user.update({ where: { id }, data: { isActive } });
    return { success: true, message: 'Estado actualizado', data: { id: updated.id, isActive: updated.isActive } };
  }

  touchLastLogin(id: number) {
    return this.prisma.user.update({ where: { id }, data: { lastLoginAt: new Date() } });
  }

  private async ensureExists(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
  }
}
