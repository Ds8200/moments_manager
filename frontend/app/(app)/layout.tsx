import { Providers } from '../providers'
import { Sidebar } from '@/shared/components/Layout/Sidebar/Sidebar'
import { Header } from '@/shared/components/Layout/Header/Header'
import { MobileBottomNav } from '@/shared/components/Layout/MobileBottomNav/MobileBottomNav'
import { MobileDrawer } from '@/shared/components/Layout/MobileDrawer/MobileDrawer'
import { AuthGuard } from '@/shared/components/AuthGuard/AuthGuard'
import { AppContentWrapper } from './AppContentWrapper'
import styles from './AppLayout.module.scss'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AuthGuard>
        <div className={styles.root}>
          <Sidebar />
          <MobileDrawer />
          <AppContentWrapper>
            <Header />
            <main className={styles.main}>{children}</main>
          </AppContentWrapper>
          <MobileBottomNav />
        </div>
      </AuthGuard>
    </Providers>
  )
}
