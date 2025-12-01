// categoria.model.ts
export interface Categoria {
  idCategoria?: number;
  nombreCategoria: string;
  descripcion?: string;
  estado: number;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

// articulo.model.ts
export interface Articulo {
  idArticulo?: number;
  nombreArticulo: string;
  descripcion?: string;
  categoria: Categoria;
  estado: number;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

// response.model.ts
export interface ApiResponse<T> {
  mensaje?: string;
  error?: string;
  data?: T;
}

// estadisticas.model.ts
export interface EstadisticasCategoria {
  totalCategorias: number;
  categoriasActivas: number;
  categoriasInactivas: number;
  categoriasConArticulos: number;
  categoriasSinArticulos: number;
}

export interface EstadisticasArticulo {
  totalArticulos: number;
  articulosActivos: number;
  articulosInactivos: number;
  articulosConStock: number;
  articulosSinInventario: number;
}