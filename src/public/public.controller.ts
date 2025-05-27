import {
  Body,
  Controller,
  Post,
  Get,
} from '@nestjs/common';
import { PublicService } from './public.service';

@Controller('public')
export class PublicController {
  constructor(private publicService: PublicService) {}

  @Post('faq')
  async createFAQ(@Body() body: {
    questionEn: string;
    questionAr: string;
    responseEn: string;
    responseAr: string;
  }) {
    return this.publicService.createFAQ(body);
  }

  @Get('faq')
  async getFAQs() {
    return this.publicService.getAllFAQs();
  }
}
