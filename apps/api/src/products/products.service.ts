import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { KyselyService } from '../database/kysely.service';
import { Product, NewProduct } from '../database/schema';

@Injectable()
export class ProductsService {
  constructor(@Inject(KyselyService) private readonly db: KyselyService) {}

  async listProducts(userId?: string): Promise<Product[]> {
    if (userId) {
      const userProducts = await this.db
        .selectFrom('products')
        .selectAll()
        .where('user_id', '=', userId)
        .orderBy('created_at', 'desc')
        .execute();

      if (userProducts.length > 0) {
        return userProducts;
      }
    }

    // Return all available products (including demo products)
    return await this.db
      .selectFrom('products')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();
  }

  async getProductById(id: string): Promise<Product> {
    const product = await this.db
      .selectFrom('products')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!product) {
      throw new NotFoundException(`Mahsulot topilmadi: ${id}`);
    }

    return product;
  }

  async createProduct(dto: {
    userId: string;
    title: string;
    category: string;
    priceUzs: number;
    discountBadge?: string;
    imageUrl: string;
  }): Promise<Product> {
    const product = await this.db
      .insertInto('products')
      .values({
        user_id: dto.userId,
        title: dto.title,
        category: dto.category,
        price_uzs: dto.priceUzs,
        discount_badge: dto.discountBadge || null,
        image_url: dto.imageUrl,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return product;
  }

  async getPresignedUploadUrl(filename: string, fileType: string) {
    const key = `products/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    return {
      uploadUrl: `https://storage.tasvir.ai/upload/${key}`,
      publicUrl: `https://storage.tasvir.ai/${key}`,
      key,
      fileType,
    };
  }
}
