import {
  Injectable,
  ForbiddenException,
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
      throw new InternalServerErrorException('Failed to create FAQ');
    }
  }

  async getAllFAQs() {
    try {
      return await this.prisma.fAQ.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch FAQs');
    }
  }
}
