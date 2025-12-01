

import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/components/layout/layout.component';


export const routes: Routes = [
  // Ruta raíz - redirigir al home
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },

  // Layout principal con todas las rutas protegidas y públicas
  { 
    path: '',
    component: LayoutComponent,
    children: [
      // ==================== RUTAS PÚBLICAS ====================
      {
        path: 'home',
        loadComponent: () => import('./modules/Inicios/Pages/home/home.component')
          .then(m => m.HomeComponent)
      },

      // ==================== RUTAS PARA CLIENTES ====================
      {
        path: 'homeClient',
        loadComponent: () => import('./modules/Inicios/Pages/home-cliente/home-cliente.component')
          .then(m => m.HomeClienteComponent)
      },

      // ==================== GESTIÓN DE EMPLEADOS ====================
      // Solo ADMIN e INVENTARIO pueden gestionar empleados
      {
        path: 'empleados',
        loadComponent: () => import('./modules/empleados/pages/empleados-list/empleados-list.component')
          .then(m => m.EmpleadosListComponent),
        data: { 
          roles: ['ADMIN', 'INVENTARIO'],
          title: 'Gestión de Empleados',
          description: 'Lista y gestión de empleados del sistema'
        }
      },
      {
        path: 'form',
        loadComponent: () => import('./modules/empleados/pages/empleado-from/empleado-from.component')
          .then(m => m.EmpleadoFromComponent),
        data: { 
          roles: ['ADMIN', 'INVENTARIO'],
          title: 'Crear Empleado',
          description: 'Formulario para crear nuevo empleado'
        }
      },
      {
        path: 'form/:id',
        loadComponent: () => import('./modules/empleados/pages/empleado-from/empleado-from.component')
          .then(m => m.EmpleadoFromComponent),
        data: { 
          roles: ['ADMIN', 'INVENTARIO'],
          title: 'Editar Empleado',
          description: 'Formulario para editar empleado existente'
        }
      },

      // ==================== GESTIÓN DE CLIENTES ====================
      // ADMIN, INVENTARIO y VENTAS pueden gestionar clientes
      {
        path: 'categorias1',
        loadComponent: () => import('./modules/Categorias/categoria/categoria.component')
          .then(m => m.CategoriaComponent),
        data: { 
          roles: ['ADMIN', 'INVENTARIO', 'VENTAS'],
          title: 'Gestión de Clientes',
          description: 'Lista y gestión de clientes del sistema'
        }
      },
      {
        path: 'tipodonante',
        loadComponent: () => import('./modules/Personas/tipo-donante/tipo-donante.component')
          .then(m => m.TipoDonanteComponent),
        data: { 
          roles: ['ADMIN', 'INVENTARIO', 'VENTAS'],
          title: 'Crear Cliente',
          description: 'Formulario para crear nuevo cliente'
        }
      },
      {
        path: 'tipobeneficiario',
        loadComponent: () => import('./modules/Personas/tipo-beneficiario/tipo-beneficiario.component')
          .then(m => m.TipoBeneficiarioComponent),
        data: { 
          roles: ['ADMIN', 'INVENTARIO', 'VENTAS'],
          title: 'Crear Cliente',
          description: 'Formulario para crear nuevo cliente'
        }
      },
       {
        path: 'beneficiario',
        loadComponent: () => import('./modules/Personas/beneficiario/beneficiario.component')
          .then(m => m.BeneficiarioComponent),
        data: { 
          roles: ['ADMIN', 'INVENTARIO', 'VENTAS'],
          title: 'Crear Cliente',
          description: 'Formulario para crear nuevo cliente'
        }
      },

      {
        path: 'tipodonacion',
        loadComponent: () => import('./modules/Personas/tipo-donacion/tipo-donacion.component')
          .then(m => m.TipoDonacionComponent),
        data: { 
          roles: ['ADMIN', 'INVENTARIO', 'VENTAS'],
          title: 'Crear Cliente',
          description: 'Formulario para crear nuevo cliente'
        }
      },
      {
        path: 'tipogasto',
        loadComponent: () => import('./modules/Personas/tipo-gasto/tipo-gasto.component')
          .then(m => m.TipoGastoComponent),
        data: { 
          roles: ['ADMIN', 'INVENTARIO', 'VENTAS'],
          title: 'Crear Cliente',
          description: 'Formulario para crear nuevo cliente'
        }
      },

      {
        path: 'voluntario',
        loadComponent: () => import('./modules/Personas/voluntario/voluntario.component')
          .then(m => m.VoluntarioComponent),
        data: { 
          roles: ['ADMIN', 'INVENTARIO', 'VENTAS'],
          title: 'Crear Cliente',
          description: 'Formulario para crear nuevo cliente'
        }
      },

      {
        path: 'donacion',
        loadComponent: () => import('./modules/Donacion/donacion/donacion.component')
          .then(m => m.DonacionComponent),
        data: { 
          roles: ['ADMIN', 'INVENTARIO', 'VENTAS'],
          title: 'Crear Cliente',
          description: 'Formulario para crear nuevo cliente'
        }
      },

      {
        path: 'donacionefec/:idDonacion',
        loadComponent: () => import('./modules/Donacion/donacion-efectivo/donacion-efectivo.component')
          .then(m => m.DonacionEfectivoComponent),
        data: { 
          roles: ['ADMIN', 'INVENTARIO', 'VENTAS'],
          title: 'Crear Cliente',
          description: 'Formulario para crear nuevo cliente'
        }
      },
      {
        path: 'donacionart/:idDonacion',
        loadComponent: () => import('./modules/Donacion/donacion-articulo/donacion-articulo.component')
          .then(m => m.DonacionArticuloComponent),
        data: { 
          roles: ['ADMIN', 'INVENTARIO', 'VENTAS'],
          title: 'Crear Cliente',
          description: 'Formulario para crear nuevo cliente'
        }
      },

      {
        path: 'donacionrepo',
        loadComponent: () => import('./modules/Donacion/donacion-reportes/donacion-reportes.component')
          .then(m => m.DonacionReportesComponent),
        data: { 
          roles: ['ADMIN', 'INVENTARIO', 'VENTAS'],
          title: 'Crear Cliente',
          description: 'Formulario para crear nuevo cliente'
        }
      },
      {
        path: 'compra',
        loadComponent: () => import('./modules/Donacion/compra-efectivo/compra-efectivo.component')
          .then(m => m.CompraEfectivoComponent),
        data: { 
          roles: ['ADMIN', 'INVENTARIO', 'VENTAS'],
          title: 'Crear Cliente',
          description: 'Formulario para crear nuevo cliente'
        }
      },

      {
        path: 'userrol',
        loadComponent: () => import('./modules/Personas/usuario-rol/usuario-rol.component')
          .then(m => m.UsuarioRolComponent),
        data: { 
          roles: ['ADMIN', 'INVENTARIO', 'VENTAS'],
          title: 'Crear Cliente',
          description: 'Formulario para crear nuevo cliente'
        }
      },
      {
        path: 'entrega',
        loadComponent: () => import('./modules/Donacion/entregas/entregas.component')
          .then(m => m.EntregasComponent),
        data: { 
          roles: ['ADMIN', 'INVENTARIO', 'VENTAS'],
          title: 'Crear Cliente',
          description: 'Formulario para crear nuevo cliente'
        }
      },

      {
        path: 'rolmenu',
        loadComponent: () => import('./modules/Personas/rol-menu/rol-menu.component')
          .then(m => m.RolMenuComponent),
        data: { 
          roles: ['ADMIN', 'INVENTARIO', 'VENTAS'],
          title: 'Crear Cliente',
          description: 'Formulario para crear nuevo cliente'
        }
      },

      
      //=============================
      // deshacer
      //==============================

      {
        path: 'donante',
        loadComponent: () => import('./modules/Personas/donante/donante.component')
          .then(m => m.DonanteComponent),
        data: { 
          roles: ['ADMIN', 'INVENTARIO', 'VENTAS'],
          title: 'Crear Cliente',
          description: 'Formulario para crear nuevo cliente'
        }
      },
      // ==================== GESTIÓN DE INVENTARIO ====================
      // Solo ADMIN e INVENTARIO
    /*  {
        path: 'inventario',
        loadComponent: () => import('./modules/Categorias/lotes/lotes.component')
          .then(m => m.LotesComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { 
          roles: ['ADMIN', 'INVENTARIO'],
          title: 'Gestión de Inventario',
          description: 'Control de lotes y stock'
        }
      },*/
      
      {
        path: 'categorias',
        loadComponent: () => import('./modules/Categorias/categoria/categoria.component')
          .then(m => m.CategoriaComponent),
        data: { 
          roles: ['ADMIN', 'INVENTARIO'],
          title: 'Gestión de Categorías',
          description: 'Administrar categorías de productos'
        }
      }, 
      {
        path: 'dashboard',
        loadComponent: () => import('./modules/Categorias/dashboard/dashboard.component')
          .then(m => m.DashboardComponent),
        data: { 
          roles: ['ADMIN', 'INVENTARIO'],
          title: 'Gestión de Categorías',
          description: 'Administrar categorías de productos'
        }
      }, 
      {
        path: 'articulo',
        loadComponent: () => import('./modules/Categorias/articulo/articulo.component')
          .then(m => m.ArticuloComponent),
        data: { 
          roles: ['ADMIN', 'INVENTARIO'],
          title: 'Gestión de Categorías',
          description: 'Administrar categorías de productos'
        }
      }, 
      {
        path: 'inventario',
        loadComponent: () => import('./modules/Categorias/inventario/inventario.component')
          .then(m => m.InventarioComponent),
        data: { 
          roles: ['ADMIN', 'INVENTARIO'],
          title: 'Gestión de Categorías',
          description: 'Administrar categorías de productos'
        }
      }, 
      {
        path: 'gastos',
        loadComponent: () => import('./modules/Configuraciones/gastos/gastos.component')
          .then(m => m.GastosComponent),
        data: { 
          roles: ['ADMIN', 'INVENTARIO'],
          title: 'Gestión de Categorías',
          description: 'Administrar categorías de productos'
        }
      }, 

       {
        path: 'gastosrepo',
        loadComponent: () => import('./modules/Configuraciones/gastos-por-tipo/gastos-por-tipo.component')
          .then(m => m.GastosPorTipoComponent),
        data: { 
          roles: ['ADMIN', 'INVENTARIO'],
          title: 'Gestión de Categorías',
          description: 'Administrar categorías de productos'
        }
      }, 
      
      // ==================== CONFIGURACIONES ADMINISTRATIVAS ====================
      // Solo ADMIN
      {
        path: 'roles',
        loadComponent: () => import('./modules/Configuraciones/roles-permisos/roles-permisos.component')
          .then(m => m.RolesPermisosComponent),
        data: { 
          roles: ['ADMIN'],
          title: 'Gestión de Roles y Permisos',
          description: 'Configurar roles y permisos del sistema'
        }
      },
      {
        path: 'menus',
        loadComponent: () => import('./modules/Configuraciones/menus/menus.component')
          .then(m => m.MenusComponent),
        data: { 
          roles: ['ADMIN'],
          title: 'Gestión de Menús',
          description: 'Configurar menús del sistema'
        }
      },

   

      // Reportes (solo ADMIN e INVENTARIO)
    /*  {
        path: 'reportes',
        loadComponent: () => import('./modules/reportes/reportes.component')
          .then(m => m.ReportesComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { 
          roles: ['ADMIN', 'INVENTARIO'],
          title: 'Reportes',
          description: 'Generar y consultar reportes del sistema'
        }
      },*/

      // Configuración de usuario (todos los usuarios autenticados)
    /*  {
        path: 'perfil',
        loadComponent: () => import('./modules/usuario/perfil/perfil.component')
          .then(m => m.PerfilComponent),
        canActivate: [AuthGuard],
        data: { 
          title: 'Mi Perfil',
          description: 'Configuración del perfil de usuario'
        }
      },*/

      // Gestión de usuarios (solo ADMIN)
     /* {
        path: 'usuarios',
        loadComponent: () => import('./modules/admin/usuarios/usuarios.component')
          .then(m => m.UsuariosComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { 
          roles: ['ADMIN'],
          title: 'Gestión de Usuarios',
          description: 'Administrar usuarios del sistema'
        }
      },*/

      // ==================== RUTAS DE ERROR Y ESTADOS ====================
      
      // Página de no autorizado
    /*  {
        path: 'unauthorized',
        loadComponent: () => import('./modules/error/unauthorized/unauthorized.component')
          .then(m => m.UnauthorizedComponent),
        data: { 
          title: 'No Autorizado',
          description: 'No tienes permisos para acceder a esta página'
        }
      },*/

      // Página de error 404
     /* {
        path: 'not-found',
        loadComponent: () => import('./modules/error/not-found/not-found.component')
          .then(m => m.NotFoundComponent),
        data: { 
          title: 'Página No Encontrada',
          description: 'La página que buscas no existe'
        }
      }*/
    ]
  },
   // ==================== RUTAS FUERA DEL LAYOUT ====================
  
  // Página de login (si necesitas una página de login separada)
  /*{
    path: 'login',
    loadComponent: () => import('./modules/auth/login/login.component')
      .then(m => m.LoginComponent),
    data: { 
      title: 'Iniciar Sesión',
      description: 'Acceso al sistema'
    }
  },*/

  // Redirigir rutas no encontradas
  {
    path: '**',
    redirectTo: '/not-found'
  }
];