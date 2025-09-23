"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getVietnameseDishStatus, handleErrorApi } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UpdateDishBody,
  UpdateDishBodyType,
} from "@/schemaValidations/dish.schema";
import { DishStatus, DishStatusValues } from "@/constants/type";
import { Textarea } from "@/components/ui/textarea";
import { useUploadMediaMutation } from "@/queries/useMedia";
import { useGetDishQuery, useUpdateDishMutation } from "@/queries/useDish";
import { toast } from "@/components/ui/use-toast";
import revalidateApiRequest from "@/apiRequests/revalidate";

export default function EditDish({
  id,
  setId,
  onSubmitSuccess,
}: {
  id?: number | undefined;
  setId: (value: number | undefined) => void;
  onSubmitSuccess?: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const uploadMediaMutation = useUploadMediaMutation();
  const updateDishMutation = useUpdateDishMutation();
  const { data } = useGetDishQuery({ enabled: Boolean(id), id: id as number });

  const form = useForm<UpdateDishBodyType>({
    resolver: zodResolver(UpdateDishBody),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      image: undefined,
      status: DishStatus.Unavailable,
    },
  });

  const image = form.watch("image");
  const name = form.watch("name");

  const previewAvatarFromFile = useMemo(() => {
    if (file) return URL.createObjectURL(file);
    return image;
  }, [file, image]);

  useEffect(() => {
    if (data) {
      const { name, image, description, price, status } = data.payload.data;
      form.reset({
        name,
        image: image ?? undefined,
        description,
        price,
        status,
      });
    }
  }, [data, form]);

  const handleGenerate = async () => {
    try {
      setGenLoading(true);
      const body = {
        name: form.getValues("name"),
        price: form.getValues("price"),
        status: form.getValues("status"),
        notes: form.getValues("description")?.slice(0, 300) || "",
      };
      const res = await fetch("/api/ai/generate-dish-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      form.setValue("description", data.description, { shouldDirty: true });
      toast({ description: "Đã tạo mô tả bằng AI." });
    } catch {
      toast({ description: "Tạo mô tả thất bại.", variant: "destructive" });
    } finally {
      setGenLoading(false);
    }
  };

  const onSubmit = async (values: UpdateDishBodyType) => {
    if (updateDishMutation.isPending) return;
    try {
      let body: UpdateDishBodyType & { id: number } = {
        id: id as number,
        ...values,
      };

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadImageResult = await uploadMediaMutation.mutateAsync(
          formData
        );
        const imageUrl = uploadImageResult.payload.data;
        body = { ...body, image: imageUrl };
      }

      const result = await updateDishMutation.mutateAsync(body);
      await revalidateApiRequest("dishes");
      toast({ description: result.payload.message });
      reset();
      onSubmitSuccess && onSubmitSuccess();
    } catch (error) {
      handleErrorApi({ error, setError: form.setError });
    }
  };

  const reset = () => {
    setId(undefined);
    setFile(null);
  };

  return (
    <Dialog
      open={Boolean(id)}
      onOpenChange={(value) => {
        if (!value) reset();
      }}
    >
      <DialogContent className="sm:max-w-[600px] max-h-screen overflow-auto">
        <DialogHeader>
          <DialogTitle>Cập nhật món ăn</DialogTitle>
          <DialogDescription>
            Các trường sau đây là bắt buộc: Tên, ảnh
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            noValidate
            className="grid auto-rows-max items-start gap-4 md:gap-8"
            id="edit-dish-form"
            onSubmit={form.handleSubmit(onSubmit, console.log)}
          >
            <div className="grid gap-4 py-4">
              {/* Ảnh */}
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex gap-2 items-start justify-start">
                      <Avatar className="h-[100px] w-[100px] rounded-md overflow-hidden">
                        <AvatarImage
                          src={previewAvatarFromFile}
                          alt={name || "Ảnh món ăn"}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "";
                          }}
                        />
                        <AvatarFallback className="h-full w-full rounded-md flex items-center justify-center">
                          {(name?.[0] || "Ảnh").toString().toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <input
                        type="file"
                        accept="image/*"
                        ref={imageInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFile(file);
                            // nếu bạn vẫn muốn lưu giá trị tạm:
                            field.onChange(
                              "http://localhost:3000/" + file.name
                            );
                          }
                        }}
                        className="hidden"
                      />

                      <button
                        className="flex aspect-square w-[100px] items-center justify-center rounded-md border border-dashed"
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        <span className="sr-only">Upload</span>
                      </button>
                    </div>
                  </FormItem>
                )}
              />

              {/* Tên */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-4 items-center justify-items-start gap-4">
                      <Label htmlFor="name">Tên món ăn</Label>
                      <div className="col-span-3 w-full space-y-2">
                        <Input id="name" className="w-full" {...field} />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              {/* Giá */}
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-4 items-center justify-items-start gap-4">
                      <Label htmlFor="price">Giá</Label>
                      <div className="col-span-3 w-full space-y-2">
                        <Input
                          id="price"
                          type="number"
                          value={field.value as number | string | undefined}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? ""
                                : e.target.valueAsNumber
                            )
                          }
                        />
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              {/* Mô tả + Tạo bằng AI */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-4 items-start justify-items-start gap-4">
                      <Label htmlFor="description">Mô tả sản phẩm</Label>
                      <div className="col-span-3 w-full space-y-2">
                        <Textarea
                          id="description"
                          className="w-full"
                          {...field}
                        />
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={handleGenerate}
                            disabled={genLoading || !form.getValues("name")}
                            className="h-7 mt-1"
                            title={
                              !form.getValues("name")
                                ? "Nhập tên món trước"
                                : ""
                            }
                          >
                            <Sparkles className="h-4 w-4 mr-1" />
                            {genLoading ? "Đang tạo..." : "Tạo bằng AI"}
                          </Button>
                        </div>
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />

              {/* Trạng thái */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-4 items-center justify-items-start gap-4">
                      <Label htmlFor="status">Trạng thái</Label>
                      <div className="col-span-3 w-full space-y-2">
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger id="status">
                              <SelectValue placeholder="Chọn trạng thái" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DishStatusValues.map((status) => (
                              <SelectItem key={status} value={status}>
                                {getVietnameseDishStatus(status)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>

        <DialogFooter>
          <Button type="submit" form="edit-dish-form">
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
