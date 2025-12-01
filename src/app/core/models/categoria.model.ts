export interface Categoria {
  idCategoria?: number;
  nombreCategoria: string;
  descripcion?: string;
  estado: number;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface Articulo {
  idArticulo?: number;
  nombreArticulo: string;
  descripcion?: string;
  categoria: Categoria;
  estado: number;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface ApiResponse<T> {
  mensaje?: string;
  error?: string;
  data?: T;
}

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

export interface InventarioArticulo {
  idInventario?: number;
  articulo?: {
    idArticulo: number;
    nombreArticulo: string;
    descripcion?: string;
    categoria?: {
      idCategoria: number;
      nombreCategoria: string;
    };
  };
  cantidadDisponible?: number;
  cantidadReservada?: number;
  fechaActualizacion?: string;
  ubicacion?: string;
  fechaCreacion?: string;
  fechaModificacion?: string;
  mensaje?: string;
}