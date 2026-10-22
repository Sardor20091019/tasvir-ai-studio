import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtUtil } from '../auth/jwt.util';

@Controller('products')
export class ProductsController {
  constructor(@Inject(ProductsService) private readonly productsService: ProductsService) {}

  @Get()
  async listProducts(
    @Query('userId') queryUserId?: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-user-id') headerUserId?: string,
  ) {
    let resolvedUserId = queryUserId;

    if (!resolvedUserId && authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const payload = JwtUtil.verify(authHeader.slice(7).trim());
        resolvedUserId = payload.sub;
      } catch (e) {}
    }

    if (!resolvedUserId && process.env.NODE_ENV !== 'production') {
      resolvedUserId = headerUserId;
    }

    return this.productsService.listProducts(resolvedUserId);
  }

  @Get(':id')
  async getProduct(@Param('id') id: string) {
    return this.productsService.getProductById(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  async createProduct(
    @CurrentUser('id') currentUserId: string,
    @Body()
    body: {
      userId?: string;
      title: string;
      category: string;
      priceUzs: number;
      discountBadge?: string;
      imageUrl: string;
    },
  ) {
    return this.productsService.createProduct({
      ...body,
      userId: currentUserId,
    });
  }

  @Post('presign-upload')
  @UseGuards(AuthGuard)
  async presignUpload(
    @Body()
    body: {
      filename: string;
      fileType: string;
    },
  ) {
    return this.productsService.getPresignedUploadUrl(body.filename, body.fileType);
  }
}
