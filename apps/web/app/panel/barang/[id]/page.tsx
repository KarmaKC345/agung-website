'use client';

import { use, useEffect, useState } from 'react';
import type { ProductDetail } from '@newagung/shared';
import { ProductForm } from '@/components/panel/ProductForm';
import { adminFetch } from '@/lib/admin';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isNew = id === 'baru';

  useEffect(() => {
    if (isNew) return;
    adminFetch<ProductDetail>(`/products/${id}`).then(setProduct).catch((e: Error) => setError(e.message));
  }, [id, isNew]);

  if (isNew) return <ProductForm />;
  if (error) return <p className="text-danger">{error}</p>;
  if (!product) return <p className="text-muted">Memuat…</p>;
  return <ProductForm product={product} />;
}
