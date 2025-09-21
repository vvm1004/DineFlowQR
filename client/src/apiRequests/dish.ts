import http from "@/lib/http";
import {
  CreateDishBodyType,
  DishListResType,
  DishResType,
  UpdateDishBodyType,
} from "@/schemaValidations/dish.schema";

const dishApiRequest = {
  // Note: Next.js 15 default fetch will be { cache: 'no-store' } (dynamic rendering page)
  // Currently next.js 14 default fetch will be { cache: 'force-cache' } which means cache (static rendering page)
  list: () =>
    http.get<DishListResType>("dishes", { next: { tags: ["dishes"] } }),
  add: (body: CreateDishBodyType) => http.post<DishResType>("dishes", body),
  getDish: (id: number) => http.get<DishResType>(`dishes/${id}`),
  updateDish: (id: number, body: UpdateDishBodyType) =>
    http.put<DishResType>(`dishes/${id}`, body),
  deleteDish: (id: number) => http.delete<DishResType>(`dishes/${id}`),
};

export default dishApiRequest;
