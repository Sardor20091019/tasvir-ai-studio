import { Controller, Get, Post, Body, Param, Query, Headers, Inject } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(@Inject(ProductsService) private readonly productsService: ProductsService) {}

  @Get()
  async listProducts(
    @Query('userId') queryUserId?: string,
    @Headers('x-user-id') headerUserId?: string,
  ) {
    const userId = queryUserId || headerUserId;
    return this.productsService.listProducts(userId);
  }

  @Get(':id')
  async getProduct(@Param('id') id: string) {
    return this.productsService.getProductById(id);
  }

  @Post()
  async createProduct(
    @Body()
    body: {
      userId: string;
      title: string;
      category: string;
      priceUzs: number;
      discountBadge?: string;
      imageUrl: string;
    },
  ) {
    return this.productsService.createProduct(body);
  }

  @Post('presign-upload')
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
