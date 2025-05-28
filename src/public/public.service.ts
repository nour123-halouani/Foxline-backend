import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PublicService {
  private prisma = new PrismaClient();

  async createFAQ(data: {
    questionEn: string;
    questionAr: string;
    responseEn: string;
    responseAr: string;
  }) {
    try {
      return await this.prisma.fAQ.create({ data });
    } catch (error) {
      throw new InternalServerErrorException('serverError');
    }
  }

  async getAllFAQs() {
    try {
      return await this.prisma.fAQ.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      throw new InternalServerErrorException('serverError');
    }
  }

  async createContactUs(data: {
    fullName: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
  }) {
    try {
      await this.prisma.contactUs.create({ data });
      return ({ message: "messageSendWithSuccess" })
    } catch (error) {
      throw new InternalServerErrorException('serverError');
    }
  }

  async getAllContactUs() {
    try {
      return await this.prisma.contactUs.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      throw new InternalServerErrorException('serverError');
    }
  }
}
