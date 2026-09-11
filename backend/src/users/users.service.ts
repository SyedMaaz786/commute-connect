import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email: email.toLowerCase() } });
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async create(data: { email: string; passwordHash: string; name: string }): Promise<User> {
    const user = this.usersRepository.create({
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      name: data.name,
    });
    return this.usersRepository.save(user);
  }
}
