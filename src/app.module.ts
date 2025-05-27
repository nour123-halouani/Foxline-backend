import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PublicModule } from './public/public.module';

@Module({
  imports: [AuthModule, PublicModule],
  controllers: [AppController],
  providers: [AppService],

})
export class AppModule { }
