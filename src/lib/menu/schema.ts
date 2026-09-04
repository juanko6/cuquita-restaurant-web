/**
 * La forma exacta de lo que devuelve MenuUnfolded.
 *
 * Esto es el contrato con un servicio que no controlamos. Si renombran un campo,
 * el build falla aquí con un mensaje claro en vez de publicar una carta rota.
 * Los campos que hoy vienen siempre vacíos —`details`, `promo_*`— se aceptan pero
 * no se mapean: existen en su API y algún día pueden traer datos.
 */
import { z } from 'zod';

const dishSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  is_available: z.boolean(),
  description: z.string().nullable(),
  details: z.string().nullable(),
  image_url: z.string().url().nullable(),
  allergens: z.array(z.string()),
  is_featured: z.boolean(),
  featured_size: z.number().int(),
  promo_price: z.number().nullable(),
  promo_start: z.string().nullable(),
  promo_end: z.string().nullable(),
});

const categorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  sort_order: z.number().int(),
  dishes: z.array(dishSchema),
  children: z.array(z.unknown()),
});

const featuredItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable(),
  details: z.string().nullable(),
  image_url: z.string().url().nullable(),
  price: z.number().nonnegative(),
  promo_price: z.number().nullable(),
  promo_start: z.string().nullable(),
  promo_end: z.string().nullable(),
  featured_size: z.number().int(),
  sort_order: z.number().int(),
  is_active: z.boolean(),
  recurrence_days: z.array(z.number().int().min(0).max(6)),
});

export const menuResponseSchema = z.object({
  allowed: z.boolean(),
  restaurant: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    slug: z.string().min(1),
  }),
  menu: z.object({
    id: z.string().min(1),
    title: z.string(),
    language: z.string(),
  }),
  categories: z.array(categorySchema),
  featured_items: z.array(featuredItemSchema),
});

export const restaurantResponseSchema = z.object({
  allowed: z.boolean(),
  restaurant: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    slug: z.string().min(1),
  }),
  menus: z
    .array(
      z.object({
        id: z.string().min(1),
        title: z.string(),
        language: z.string(),
        sort_order: z.number().int(),
      }),
    )
    .min(1),
});

export type MenuResponse = z.infer<typeof menuResponseSchema>;
export type RestaurantResponse = z.infer<typeof restaurantResponseSchema>;
