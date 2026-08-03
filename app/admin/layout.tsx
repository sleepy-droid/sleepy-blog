import { requireAdmin } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

/**
 * Layout del panel admin.
 * requireAdmin() redirige a login o al home si no eres admin.
 * La UI del sidebar solo se renderiza si pasas la verificación.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await requireAdmin()
  const name =
    admin.profile?.display_name ||
    admin.email?.split('@')[0] ||
    'Administrador'

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 font-sans">
      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        <AdminSidebar adminName={name} />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  )
}
