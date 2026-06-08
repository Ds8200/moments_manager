import { Providers } from '../providers'
import { AuthGuard } from '@/shared/components/AuthGuard/AuthGuard'
import { SysAdminGuard } from '@/shared/components/SysAdminGuard/SysAdminGuard'
import { Sidebar } from '@/shared/components/Layout/Sidebar/Sidebar'
import { Header } from '@/shared/components/Layout/Header/Header'
import { MobileDrawer } from '@/shared/components/Layout/MobileDrawer/MobileDrawer'
import { SuperAdminContentWrapper } from './SuperAdminContentWrapper'
import styles from './SuperAdminLayout.module.scss'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AuthGuard>
        <SysAdminGuard>
          <div className={styles.root}>
            <Sidebar />
            <MobileDrawer />
            <SuperAdminContentWrapper>
              <Header />
              <main className={styles.main}>{children}</main>
            </SuperAdminContentWrapper>
          </div>
        </SysAdminGuard>
      </AuthGuard>
    </Providers>
  )
}
