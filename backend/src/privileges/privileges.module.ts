import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Privilege } from '../entities';
import { PrivilegesService } from './privileges.service';
import { PrivilegesController } from './privileges.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Privilege])],
  controllers: [PrivilegesController],
  providers: [PrivilegesService],
  exports: [PrivilegesService],
})
export class PrivilegesModule {}
